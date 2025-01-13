import {
  arrayUnion,
  collection,
  doc,
  getDocs,
  serverTimestamp,
  setDoc,
  updateDoc,
} from "firebase/firestore";
import "./addUser.css";
import { db } from "../../../../lib/firebase";
import { useState } from "react";
import { useUserStore } from "../../../../lib/userStore";

const AddUser = ({ setAddMode }) => {
  const [user, setUser] = useState(null);

  const { currentUser } = useUserStore();

  const handleSearch = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const username = formData.get("username").toLowerCase();

    try {
      const userRef = collection(db, "users");

      const querySnapshot = await getDocs(userRef);

      const foundUsers = querySnapshot.docs.filter((doc) =>
        doc.data().username.toLowerCase().includes(username)
      );

      if (foundUsers.length > 0) {
        setUser(foundUsers.map((doc) => doc.data()));
      } else {
        console.log("No users found");
        setUser([]);
      }
    } catch (err) {
      console.log(err);
    }
  };

  const handleAdd = async () => {
    const chatRef = collection(db, "chats");
    const userChatRef = collection(db, "userchats");

    try {
      const newChatRef = doc(chatRef);

      await setDoc(newChatRef, {
        createdAt: serverTimestamp(),
        messages: [],
      });

      await updateDoc(doc(userChatRef, user.id), {
        chats: arrayUnion({
          chatId: newChatRef.id,
          lastMessage: "",
          receiverId: currentUser.id,
          updatedAt: Date.now(),
        }),
      });

      await updateDoc(doc(userChatRef, currentUser.id), {
        chats: arrayUnion({
          chatId: newChatRef.id,
          lastMessage: "",
          receiverId: user.id,
          updatedAt: Date.now(),
        }),
      });

      console.log(newChatRef.id);

      setAddMode(false);
    } catch (err) {
      console.log(err);
    }
  };

  return (
    <div className="addUser">
      <form onSubmit={handleSearch}>
        <input type="text" placeholder="Username" name="username" />
        <button>Search</button>
      </form>
      {user && user.length > 0 && (
        <div className="users">
          {user.map((u, index) => (
            <div key={index} className="user">
              <div className="detail">
                <img src={u.avatar || "./avatar.png"} alt="" />
                <span>{u.username}</span>
              </div>
              <button onClick={handleAdd}>Add User</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AddUser;
