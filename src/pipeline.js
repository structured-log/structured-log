const _pipelineStages = new WeakMap();
const _headStage = new WeakMap();

export default class Pipeline {
  constructor(pipelineStages) {
    if (!Array.isArray(pipelineStages) || pipelineStages.length === 0) {
      throw new Error('No pipeline stages defined!');
    }

    _pipelineStages.set(this, pipelineStages);
    _headStage.set(this, pipelineStages[0]);

    for (let stageIndex = 0, lastStageIndex = pipelineStages.length - 1; stageIndex < lastStageIndex; ++stageIndex) {
      pipelineStages[stageIndex].setNextStage(pipelineStages[stageIndex + 1]);
    }
  }

  emit(logEvents) {
    return _headStage.get(this).emit(logEvents);
  }

  flush() {
    return _headStage.get(this).flush();
  }

  close() {
    return _headStage.get(this).close();
  }
}
