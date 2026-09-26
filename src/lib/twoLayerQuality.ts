export type DemoReplySource = 'rule' | 'model' | 'canned';

export type DemoReplySignals = {
  mentionsStarterLink: boolean;
  mentionsHandoff: boolean;
  mentionsSafePreview: boolean;
  mentionsSetupPath: boolean;
};

export type QualityTransportInput = {
  firstTokenMs?: number;
  totalResponseMs?: number;
  usedSse?: boolean;
  fallbackUsed?: boolean;
  twilio?: {
    mos?: number;
    jitterMs?: number;
    packetLossPct?: number;
    roundTripMs?: number;
  };
};

export type QualityConversationInput = {
  source: DemoReplySource;
  signals?: DemoReplySignals;
  userTurns?: number;
};

export type TwoLayerQualityInput = {
  transport: QualityTransportInput;
  conversation: QualityConversationInput;
};

export type TwoLayerQualityReport = {
  scores: {
    transport: number;
    conversation: number;
    overall: number;
  };
  grade: 'A' | 'B' | 'C' | 'D';
  reasons: string[];
  recommendations: string[];
};

function clamp(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function grade(overall: number): TwoLayerQualityReport['grade'] {
  if (overall >= 85) return 'A';
  if (overall >= 75) return 'B';
  if (overall >= 65) return 'C';
  return 'D';
}

function addUnique(arr: string[], text: string) {
  if (!arr.includes(text)) arr.push(text);
}

function scoreTransport(
  input: QualityTransportInput,
  reasons: string[],
  recommendations: string[],
): number {
  let score = 86;

  if (input.usedSse) {
    score += 4;
    addUnique(reasons, 'SSE streaming path is active.');
  } else {
    score -= 4;
    addUnique(reasons, 'Streaming fallback path was used.');
  }

  const firstToken = input.firstTokenMs ?? null;
  if (typeof firstToken === 'number') {
    if (firstToken > 2500) {
      score -= 24;
      addUnique(reasons, `First token is slow (${Math.round(firstToken)}ms).`);
      addUnique(
        recommendations,
        'Reduce first-token latency by pre-warming model sessions and keeping prompts concise.',
      );
    } else if (firstToken > 1500) {
      score -= 14;
      addUnique(reasons, `First token is moderate (${Math.round(firstToken)}ms).`);
    } else {
      addUnique(reasons, `First token is healthy (${Math.round(firstToken)}ms).`);
    }
  }

  const total = input.totalResponseMs ?? null;
  if (typeof total === 'number') {
    if (total > 7000) {
      score -= 16;
      addUnique(reasons, `Total response time is high (${Math.round(total)}ms).`);
    } else if (total > 4500) {
      score -= 8;
      addUnique(reasons, `Total response time is acceptable (${Math.round(total)}ms).`);
    }
  }

  if (input.fallbackUsed) {
    score -= 10;
    addUnique(reasons, 'Client had to use a non-SSE fallback.');
    addUnique(
      recommendations,
      'Monitor SSE/network failures and keep simulated mode as a controlled fallback.',
    );
  }

  const tw = input.twilio;
  if (tw) {
    if (typeof tw.mos === 'number') {
      if (tw.mos < 3.5) {
        score -= 20;
        addUnique(reasons, `Twilio MOS is low (${tw.mos.toFixed(2)}).`);
        addUnique(
          recommendations,
          'Set Voice Insights alerts for MOS drops and investigate carrier/edge regions.',
        );
      } else if (tw.mos < 4.0) {
        score -= 8;
        addUnique(reasons, `Twilio MOS is fair (${tw.mos.toFixed(2)}).`);
      }
    }

    if (typeof tw.jitterMs === 'number' && tw.jitterMs > 30) {
      score -= 10;
      addUnique(reasons, `Twilio jitter is elevated (${Math.round(tw.jitterMs)}ms).`);
    }
    if (typeof tw.packetLossPct === 'number' && tw.packetLossPct > 1.5) {
      score -= 14;
      addUnique(
        reasons,
        `Twilio packet loss is elevated (${tw.packetLossPct.toFixed(2)}%).`,
      );
    }
    if (typeof tw.roundTripMs === 'number' && tw.roundTripMs > 260) {
      score -= 8;
      addUnique(reasons, `Twilio round-trip latency is high (${Math.round(tw.roundTripMs)}ms).`);
    }

    if (score < 72) {
      addUnique(
        recommendations,
        'For voice quality, prioritize nearest Twilio edge region and monitor jitter/packet-loss by carrier.',
      );
    }
  }

  return clamp(score);
}

function scoreConversation(
  input: QualityConversationInput,
  reasons: string[],
  recommendations: string[],
): number {
  let score = input.source === 'model' ? 80 : input.source === 'rule' ? 75 : 67;
  const signals = input.signals;

  if (signals?.mentionsHandoff) {
    score += 9;
    addUnique(reasons, 'Reply clearly supports human handoff.');
  } else {
    addUnique(
      recommendations,
      'Add explicit handoff language when confidence is low or issue is sensitive.',
    );
  }

  if (signals?.mentionsSafePreview) {
    score += 5;
    addUnique(reasons, 'Reply keeps demo-safe expectations clear.');
  }

  if (signals?.mentionsSetupPath) {
    score += 6;
    addUnique(reasons, 'Reply gives setup/onboarding direction.');
  }

  if (signals?.mentionsStarterLink) {
    score += 5;
    addUnique(reasons, 'Reply addresses Starter Link fit for SBOs.');
  }

  if (typeof input.userTurns === 'number' && input.userTurns >= 3) {
    score += 2;
  }

  if (input.source === 'canned') {
    addUnique(
      recommendations,
      'Increase model/rule hit rate for multi-turn conversations to improve relevance.',
    );
  }

  return clamp(score);
}

export function evaluateTwoLayerQuality(
  input: TwoLayerQualityInput,
): TwoLayerQualityReport {
  const reasons: string[] = [];
  const recommendations: string[] = [];

  const transport = scoreTransport(input.transport, reasons, recommendations);
  const conversation = scoreConversation(input.conversation, reasons, recommendations);
  const overall = clamp(transport * 0.45 + conversation * 0.55);

  if (overall < 75) {
    addUnique(
      recommendations,
      'Prioritize first-response speed and confidence-based escalation before expanding features.',
    );
  }

  return {
    scores: {
      transport,
      conversation,
      overall,
    },
    grade: grade(overall),
    reasons,
    recommendations,
  };
}
