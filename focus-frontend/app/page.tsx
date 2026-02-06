import Image from "next/image";
import Signup from "./components/Signup";
import Login from "./components/Login";

export default function Home() {
  return (
    <div>Hi
      <Signup />
      <Login />
    </div>
  );
}
