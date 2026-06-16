import { useSearchParams } from "react-router-dom";
import ResetPasswordFlow from "../components/ResetPasswordFlow";

function ResetPassword() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") || "";
  return <ResetPasswordFlow initialStage="set" token={token} />;
}

export default ResetPassword;
