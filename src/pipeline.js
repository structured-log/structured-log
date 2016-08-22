class Pipeline {
  constructor(pipelineStages) {
    if (!Array.isArray(pipelineStages) || pipelineStages.length === 0) {
      throw new Error('No pipeline stages defined!');
    }

    this.pipelineStages = pipelineStages;
    this.headStage = this.pipelineStages[0];

    for (let stageIndex = 0, lastStageIndex = this.pipelineStages.length - 1; stageIndex < lastStageIndex; ++stageIndex) {
      this.pipelineStages[stageIndex].setNextStage(this.pipelineStages[stageIndex + 1]);
    }
  }

  emit = (logEvents, done) => {
    this.headStage.emit(logEvents, done);
  }

  flush = done => {

  }

  close = done => {

  }
}

export default Pipeline;
