import { AppShell } from "@/components/navigation/AppShell";import { MockStoreProvider } from "@/mocks/store";
export default function Home(){return <MockStoreProvider><AppShell/></MockStoreProvider>}
