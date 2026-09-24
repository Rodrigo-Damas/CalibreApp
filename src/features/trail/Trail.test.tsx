import {cleanup,fireEvent,render,screen} from "@testing-library/react";
import {afterEach,describe,expect,it} from "vitest";
import {MockStoreProvider} from "@/mocks/store";
import {Trail} from "./Trail";
const renderTrail=()=>render(<MockStoreProvider><Trail/></MockStoreProvider>);afterEach(cleanup);
describe("Trail",()=>{
 it("troca a trilha mobile-first por abas e comunica seus estados",()=>{renderTrail();expect(screen.getAllByRole("tab")).toHaveLength(5);fireEvent.click(screen.getByRole("tab",{name:"Puxar"}));expect(screen.getByRole("heading",{name:"Puxar"})).toBeInTheDocument();expect(screen.getByLabelText(/Recorde de Puxar/)).toBeInTheDocument();expect(screen.getByText("7 × 5 = 35 repetições totais")).toBeInTheDocument()});
 it("seleciona no máximo duas trilhas e exibe o dock sem sobrepor o fluxo",()=>{renderTrail();fireEvent.click(screen.getByRole("button",{name:/Selecionar sugestão de Empurrar/}));fireEvent.click(screen.getByRole("tab",{name:"Puxar"}));fireEvent.click(screen.getByRole("button",{name:/Selecionar sugestão de Puxar/}));expect(screen.getByText("10 min")).toBeInTheDocument();fireEvent.click(screen.getByRole("tab",{name:"Pernas"}));expect(screen.getByRole("button",{name:/Selecionar sugestão de Pernas/})).toBeDisabled()});
 it("abre o histórico com métricas e composição de resultados",()=>{renderTrail();fireEvent.click(screen.getByRole("button",{name:"Ver evolução"}));expect(screen.getByRole("dialog",{name:"Histórico de Empurrar"})).toBeInTheDocument();expect(screen.getByText("Último resultado")).toBeInTheDocument();expect(screen.getByText("Desde o início")).toBeInTheDocument();expect(screen.getByText(/5 × 14 = 70/)).toBeInTheDocument();fireEvent.click(screen.getByRole("button",{name:"Fechar histórico"}));expect(screen.queryByRole("dialog")).not.toBeInTheDocument()});
});
