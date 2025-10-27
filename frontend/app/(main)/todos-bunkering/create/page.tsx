"use client";
import BunkeringForm from "@/components/bunkeringComponents/BunkeringForm";
import { Page } from "../../../../types/layout";

const Login: Page = () => {
  return (
    <BunkeringForm
      bunkering={null}
      hideBunkeringFormDialog={() => {}}
      bunkerings={[]}
      setBunkerings={() => {}}
    />
  );
};

export default Login;
