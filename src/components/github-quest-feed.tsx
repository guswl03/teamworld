import {
  GITHUB_QUEST_EMPTY_COPY,
  presentGitHubQuest,
  type GitHubQuest,
} from "@/lib/github-quests";

export function GitHubQuestFeed({ quests }: { quests: GitHubQuest[] }) {
  const newest = quests[0];
  return (
    <section
      className="github-quest-feed"
      aria-labelledby="github-quests-title"
    >
      <header className="github-quest-heading">
        <div>
          <span>CONNECTED WORK</span>
          <h2 id="github-quests-title">GITHUB QUESTS</h2>
        </div>
        <small>
          {quests.length ? `${quests.length} RECENT` : "LIVE BOARD"}
        </small>
      </header>
      <p
        className="github-quest-announcement"
        aria-live="polite"
        aria-atomic="true"
      >
        {newest ? `GitHub 퀘스트 업데이트: ${newest.quest.title}` : ""}
      </p>
      {quests.length === 0 ? (
        <p className="github-quest-empty">{GITHUB_QUEST_EMPTY_COPY}</p>
      ) : (
        <ol className="github-quest-list" aria-label="최근 GitHub 퀘스트">
          {quests.map((item) => {
            const presentation = presentGitHubQuest(item);
            return (
              <li
                key={`${item.repository.id}:${item.quest.kind}:${item.quest.id}`}
                className={
                  item.quest.status === "completed" ? "completed" : "open"
                }
              >
                <div className="github-quest-repository">
                  <span aria-hidden="true">▣</span>
                  <strong>{item.repository.name}</strong>
                  <small>{item.repository.owner}</small>
                </div>
                <div className="github-quest-title">
                  <span>{presentation.kind}</span>
                  <span>{presentation.number}</span>
                  <strong>{item.quest.title}</strong>
                </div>
                <div className="github-quest-meta">
                  <span className={`github-quest-state ${item.quest.status}`}>
                    {presentation.status}
                  </span>
                  <small>{presentation.event}</small>
                </div>
              </li>
            );
          })}
        </ol>
      )}
    </section>
  );
}
