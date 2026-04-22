// src/lib/realtime-webrtc.ts

export type RealtimeCallbacks = {
  onUserTranscript?: (text: string) => void;
  onAssistantTranscript?: (text: string) => void;
  onUserSpeechStart?: () => void;
  onUserSpeechStop?: () => void;
  onAssistantSpeechStart?: () => void;
  onAssistantSpeechStop?: () => void;
  onInterrupted?: () => void;
  onError?: (message: string) => void;
};

export type RealtimeConnection = {
  pc: RTCPeerConnection;
  dc: RTCDataChannel;
  audioEl: HTMLAudioElement;
  interrupt: () => void;
  speak: (text: string) => void;
};

export async function connectRealtime(
  clientSecret: string,
  callbacks: RealtimeCallbacks = {}
): Promise<RealtimeConnection> {
  const pc = new RTCPeerConnection();

  const audioEl = document.createElement("audio");
  audioEl.autoplay = true;

  pc.ontrack = (e) => {
    audioEl.srcObject = e.streams[0];
  };

  const stream = await navigator.mediaDevices.getUserMedia({
    audio: true,
  });

  stream.getTracks().forEach((track) => {
    pc.addTrack(track, stream);
  });

  const dc = pc.createDataChannel("oai-events");

  function interrupt() {
    if (dc.readyState !== "open") return;

    dc.send(
      JSON.stringify({
        type: "response.cancel",
      })
    );

    dc.send(
      JSON.stringify({
        type: "output_audio_buffer.clear",
      })
    );

    callbacks.onInterrupted?.();
  }

  function speak(text: string) {
    if (dc.readyState !== "open") return;

    const cleaned = text.trim();
    if (!cleaned) return;

    dc.send(
      JSON.stringify({
        type: "response.create",
        response: {
          modalities: ["audio", "text"],
          instructions: cleaned,
        },
      })
    );
  }

  dc.onopen = () => {
    console.log("Realtime data channel open");
  };

  dc.onerror = () => {
    callbacks.onError?.("Realtime error");
  };

  dc.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      const type = data?.type;

      console.log("RT_EVENT", type);

      if (type === "input_audio_buffer.speech_started") {
        callbacks.onUserSpeechStart?.();
      }

      if (type === "input_audio_buffer.speech_stopped") {
        callbacks.onUserSpeechStop?.();
      }

      if (
        type === "conversation.item.input_audio_transcription.delta" &&
        typeof data?.delta === "string"
      ) {
        callbacks.onUserTranscript?.(data.delta);
      }

      if (
        type === "conversation.item.input_audio_transcription.completed" &&
        typeof data?.transcript === "string"
      ) {
        callbacks.onUserTranscript?.(data.transcript);
      }

      if (type === "response.created") {
        callbacks.onAssistantSpeechStart?.();
      }

      if (type === "response.done") {
        callbacks.onAssistantSpeechStop?.();
      }

      if (
        (type === "response.audio_transcript.delta" ||
          type === "response.output_audio_transcript.delta") &&
        typeof data?.delta === "string"
      ) {
        callbacks.onAssistantTranscript?.(data.delta);
      }

      if (
        (type === "response.audio_transcript.done" ||
          type === "response.output_audio_transcript.done") &&
        typeof data?.transcript === "string"
      ) {
        callbacks.onAssistantTranscript?.(data.transcript);
      }
    } catch {}
  };

  const offer = await pc.createOffer();
  await pc.setLocalDescription(offer);

  const sdpResponse = await fetch(
    "https://api.openai.com/v1/realtime/calls",
    {
      method: "POST",
      body: offer.sdp,
      headers: {
        Authorization: `Bearer ${clientSecret}`,
        "Content-Type": "application/sdp",
      },
    }
  );

  const answer = await sdpResponse.text();

  await pc.setRemoteDescription({
    type: "answer",
    sdp: answer,
  });

  return {
    pc,
    dc,
    audioEl,
    interrupt,
    speak,
  };
}