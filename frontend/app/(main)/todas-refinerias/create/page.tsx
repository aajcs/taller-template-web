"use client";
import RefineriaForm from "@/components/refineriaComponents/RefineriaForm";
import { Page } from "../../../../types/layout";

const Login: Page = () => {
  return (
    <RefineriaForm
      refineria={null}
      hideRefineriaFormDialog={() => {}}
      refinerias={[]}
      setRefinerias={() => {}}
    />
  );
};

export default Login;
