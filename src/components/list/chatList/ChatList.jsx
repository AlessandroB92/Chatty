import { useEffect, useState } from "react";
import "./chatList.css";
import AddUser from "./addUser/AddUser";
import { useUserStore } from "../../../lib/userStore";
import { doc, getDoc, onSnapshot, updateDoc } from "firebase/firestore";
import { db } from "../../../lib/firebase";
import { useChatStore } from "../../../lib/chatStore";
import useUserStatus from "../../../lib/useUserStatus";

// Funzione per calcolare la differenza in giorni tra la data corrente e l'ultimo accesso
const formatLastAccess = (lastAccessTimestamp) => {
  const currentDate = new Date();
  const lastAccessDate = new Date(lastAccessTimestamp.seconds * 1000);

  const diffInMs = currentDate - lastAccessDate;
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24)); // Differenza in giorni

  if (diffInDays === 0) {
    // Se l'ultimo accesso è oggi, mostra l'ora
    const hours = lastAccessDate.getHours();
    const minutes = lastAccessDate.getMinutes();
    const formattedTime = `${hours}:${minutes < 10 ? "0" + minutes : minutes}`;
    return `Oggi alle ${formattedTime}`;
  } else if (diffInDays === 1) {
    // Se l'ultimo accesso è ieri
    return "1 giorno fa";
  } else if (diffInDays === 2) {
    // Se l'ultimo accesso è due giorni fa
    return "2 giorni fa";
  } else {
    // Se l'ultimo accesso è più di 2 giorni fa, mostra la data e l'ora
    return lastAccessDate.toLocaleString();
  }
};


const ChatList = () => {
  const [chats, setChats] = useState([]);
  const [addMode, setAddMode] = useState(false);
  const [input, setInput] = useState("");
  const [selectedChat, setSelectedChat] = useState(null); // Stato per tracciare la chat selezionata

  const { currentUser } = useUserStore();
  const { chatId, changeChat } = useChatStore();
  const { usersStatus } = useUserStatus();  // Stato di tutti gli utenti

  useEffect(() => {
    const unSub = onSnapshot(
      doc(db, "userchats", currentUser.id),
      async (res) => {
        const items = res.data().chats;

        const promisses = items.map(async (item) => {
          const userDocRef = doc(db, "users", item.receiverId);
          const userDocSnap = await getDoc(userDocRef);

          const user = userDocSnap.data();

          return { ...item, user };
        });

        const chatData = await Promise.all(promisses);

        setChats(chatData.sort((a, b) => b.updatedAt - a.updatedAt));
      }
    );

    return () => {
      unSub();
    };
  }, [currentUser.id]);

  const handleSelect = async (chat) => {
    const userChats = chats.map((item) => {
      const { user, ...rest } = item;
      return rest;
    });
    const chatIndex = userChats.findIndex(
      (item) => item.chatId === chat.chatId
    );

    userChats[chatIndex].isSeen = true;

    const userChatRef = doc(db, "userchats", currentUser.id);

    try {
      await updateDoc(userChatRef, {
        chats: userChats,
      });
      setSelectedChat(chat.chatId); // Imposta la chat selezionata
      changeChat(chat.chatId, chat.user);
    } catch (err) {
      console.log(err);
    }
  };

  const filteredChats = chats.filter((c) =>
    c.user.username.toLowerCase().includes(input.toLowerCase())
  );

  return (
    <div className="chatList">
      <div className="search">
        <div className="searchBar">
          <img src="/search.png" alt="" />
          <input
            type="text"
            placeholder="Search"
            onChange={(e) => setInput(e.target.value)}
          />
        </div>
        <img
          src={addMode ? "./minus.png" : "./plus.png"}
          alt=""
          className="add"
          onClick={() => setAddMode((prev) => !prev)}
        />
      </div>
      <div className="listContainer">
      {filteredChats.map((chat) => (
            <div
              className="item"
              key={chat.chatId}
              onClick={() => handleSelect(chat)}
              style={{
                backgroundColor:
                  chat.chatId === selectedChat ? "#dddddd73" : chat?.isSeen ? "transparent" : "#5183fe", // Evidenzia la chat selezionata
              }}
            >
              <img
                src={
                  chat.user.blocked.includes(currentUser.id)
                    ? "./avatar.png"
                    : chat.user.avatar || "./avatar.png"
                }
                alt=""
              />
              <div className="texts">
                <span>
                  {chat.user.blocked.includes(currentUser.id)
                    ? "User"
                    : chat.user.username}
                </span>
                <span className={`status ${usersStatus[chat.user.id]?.status === "online" ? "online" : "offline"}`}>
                  {usersStatus[chat.user.id]?.status === "online" ? "Online" : "Offline"}
                </span>
                <p>{chat.lastMessage}</p>
                <p className="lastAccess">
                  Ultimo accesso:{" "}
                  {usersStatus[chat.user.id]?.lastAccess
                    ? formatLastAccess(usersStatus[chat.user.id].lastAccess)
                    : "N/A"}
                </p>
              </div>
            </div>
      ))}
      </div>
      {addMode && <AddUser setAddMode={setAddMode} />}
    </div>
  );
};

export default ChatList;

