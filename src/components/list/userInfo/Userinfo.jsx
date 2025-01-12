import "./userInfo.css";
import {useUserStore} from "../../../lib/userStore";
import { auth } from "../../../lib/firebase";

const Userinfo = () => {

  const {currentUser} = useUserStore();

  return (
    <div className="userInfo">
      <div className="user">
        <img src={currentUser.avatar || "./avatar.png"} alt="" />
        <h2>{currentUser.username}</h2>
      </div>
      <div className="icons">
      <button className="logout" onClick={() => auth.signOut()}>
          Logout
        </button>
      </div>
    </div>
  );
};

export default Userinfo;
