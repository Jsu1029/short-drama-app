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
};

export function getInteractionsByEpisodeId(episodeId) {
  return interactionsByEpisodeId[episodeId] ?? [];
}

