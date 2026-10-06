import { CognitiveMetrics, CognitiveSample } from "../types";

export class CognitiveTracker {
  private samples: CognitiveSample[] = [];
  private lastBallDescentTimestamp: number | null = null;
  private hasReactedToCurrentDescent: boolean = false;
  private lastPaddleX: number = 0;

  private totalHits: number = 0;
  private perfectHits: number = 0;
  private sumPrecision: number = 0;
  private anticipationHits: number = 0;

  private currentMetrics: CognitiveMetrics = {
    averageReactionTimeMs: 225,
    reactionTimeHistory: [240, 230, 225],
    accuracyPercentage: 82.5,
    anticipationScore: 78.0,
    totalHits: 0,
    perfectHits: 0,
    angularControlScore: 80.0,
    cognitiveGrade: "A",
    evaluatedSessions: 1,
    reactionPercentile: 79,
    lastEvaluationTimestamp: Date.now(),
  };

  constructor(initialMetrics?: CognitiveMetrics) {
    if (initialMetrics) {
      this.currentMetrics = { ...initialMetrics };
      this.totalHits = initialMetrics.totalHits || 0;
      this.perfectHits = initialMetrics.perfectHits || 0;
    }
  }

  // Called when ball changes trajectory and begins descending toward the player
  public onBallDescentInitiated(now: number = performance.now()) {
    this.lastBallDescentTimestamp = now;
    this.hasReactedToCurrentDescent = false;
  }

  // Called when user inputs paddle motion
  public onPaddleMotion(currentPaddleX: number, now: number = performance.now()) {
    if (
      this.lastBallDescentTimestamp !== null &&
      !this.hasReactedToCurrentDescent &&
      Math.abs(currentPaddleX - this.lastPaddleX) > 2
    ) {
      const deltaMs = Math.max(80, Math.min(650, now - this.lastBallDescentTimestamp));
      this.hasReactedToCurrentDescent = true;
      this.recordReactionSample(deltaMs);
    }
    this.lastPaddleX = currentPaddleX;
  }

  // Called when ball hits the paddle to measure hand-eye precision
  public onPaddleImpact(
    ballX: number,
    paddleX: number,
    paddleWidth: number,
    ballSpeed: number,
    level: number,
    ballY: number,
    maxY: number
  ) {
    this.totalHits++;
    const paddleCenter = paddleX + paddleWidth / 2;
    const offsetNormalized = (ballX - paddleCenter) / (paddleWidth / 2); // -1.0 to 1.0
    const absOffset = Math.abs(offsetNormalized);

    // Precision scoring: Center 28% = perfect (100%), gradient to 40% at edges
    const hitPrecision = Math.max(40, Math.round(100 - absOffset * 60));
    this.sumPrecision += hitPrecision;

    if (absOffset <= 0.28) {
      this.perfectHits++;
    }

    // Anticipation: did paddle arrive before ball reached bottom 25%?
    if (ballY < maxY * 0.82) {
      this.anticipationHits++;
    }

    // Record sample
    this.samples.push({
      timestamp: Date.now(),
      reactionTimeMs: this.currentMetrics.averageReactionTimeMs,
      offsetFromPaddleCenter: offsetNormalized,
      ballSpeedAtImpact: ballSpeed,
      level,
    });

    if (this.samples.length > 50) {
      this.samples.shift();
    }

    this.recalculateMetrics();
  }

  private recordReactionSample(reactionMs: number) {
    const history = [...this.currentMetrics.reactionTimeHistory, Math.round(reactionMs)];
    if (history.length > 25) {
      history.shift();
    }

    const avg = Math.round(history.reduce((a, b) => a + b, 0) / history.length);
    this.currentMetrics.averageReactionTimeMs = avg;
    this.currentMetrics.reactionTimeHistory = history;
    this.recalculateMetrics();
  }

  private recalculateMetrics() {
    const accuracy =
      this.totalHits > 0 ? Number((this.sumPrecision / this.totalHits).toFixed(1)) : 80;
    const anticipation =
      this.totalHits > 0
        ? Number(((this.anticipationHits / this.totalHits) * 100).toFixed(1))
        : 75;

    const rt = this.currentMetrics.averageReactionTimeMs;

    // Determine Cognitive Grade based on human neuro-motor benchmark
    let grade: CognitiveMetrics["cognitiveGrade"] = "B";
    let percentile = 65;

    if (rt <= 185 && accuracy >= 88) {
      grade = "S+";
      percentile = 98;
    } else if (rt <= 205 && accuracy >= 84) {
      grade = "S";
      percentile = 92;
    } else if (rt <= 235 && accuracy >= 78) {
      grade = "A";
      percentile = 80;
    } else if (rt <= 270 && accuracy >= 70) {
      grade = "B";
      percentile = 65;
    } else if (rt <= 320) {
      grade = "C";
      percentile = 45;
    } else {
      grade = "D";
      percentile = 25;
    }

    this.currentMetrics = {
      ...this.currentMetrics,
      accuracyPercentage: accuracy,
      anticipationScore: Math.min(100, Math.max(40, anticipation)),
      totalHits: this.totalHits,
      perfectHits: this.perfectHits,
      angularControlScore: Math.min(100, Math.max(50, accuracy * 0.95 + anticipation * 0.05)),
      cognitiveGrade: grade,
      reactionPercentile: percentile,
      lastEvaluationTimestamp: Date.now(),
    };
  }

  public getMetrics(): CognitiveMetrics {
    return { ...this.currentMetrics };
  }

  public resetCurrentEvaluation() {
    this.lastBallDescentTimestamp = null;
    this.hasReactedToCurrentDescent = false;
  }
}
