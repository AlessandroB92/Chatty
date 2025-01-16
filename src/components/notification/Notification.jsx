import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const Notification = () => {
  return (
    <div className="">
      <ToastContainer position="bottom-right" autoClose={2000} />
    </div>
  );
};

export default Notification;
