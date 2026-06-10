const interactionsByEpisodeId = {
  'huangnian-ep01': [
    {
      id: 'choice-ep01-064',
      type: 'choice',
      atSec: 64,
      title: '主角倒了，你想怎么做？',
      options: [
        { id: 'revive', label: '扣1复活' },
        { id: 'no_die', label: '我不想死' },
      ],
    },
  ],
  'huangnian-ep07': [
    {
      id: 'branch-ep07-072',
      type: 'branch_choice',
      atSec: 72,
      title: '触发支线剧情，要不要进入？',
      options: [
        { id: 'enter_branch', label: '进入支线' },
        { id: 'continue_main', label: '继续主线' },
      ],
      branchTitle: '支线剧情',
      branchVideo: require('../../assets/videos/huangnian/branch_ep07.mp4'),
    },
  ],
};

export function getInteractionsByEpisodeId(episodeId) {
  return interactionsByEpisodeId[episodeId] ?? [];
}
