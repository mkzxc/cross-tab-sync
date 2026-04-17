import { useEffect, useState, type FC } from "react";
import { useGetMessages } from "../presenters/useGetMessages";
import { usePostMessages } from "../presenters/usePostMessages";
import { tab } from "../../../main";

const Messages: FC = () => {
  const { messages } = useGetMessages();
  const postMessages = usePostMessages();
  const [isClosing, setIsClosing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    tab.subscribe("WORKER_TERMINATED", () => {
      setIsClosing(false);
      setError("No-op");
    });
  }, []);

  if (isClosing) {
    return <p>Closing...</p>;
  }

  if (error) {
    return <p>{error}</p>;
  }

  return (
    <div>
      <ul>
        {messages.map((value) => {
          return (
            <li key={value.id}>
              {value.content} {value.created_at}
            </li>
          );
        })}
      </ul>
      <button
        type="button"
        onClick={() => postMessages.mutate()}
        disabled={postMessages.isPending}
      >
        POST
      </button>
      <button
        type="button"
        onClick={() => {
          setIsClosing(true);
          tab.closeWorker();
        }}
      >
        CLOSE
      </button>
    </div>
  );
};

export { Messages };
