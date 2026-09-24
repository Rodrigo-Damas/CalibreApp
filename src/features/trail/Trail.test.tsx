import { cleanup,fireEvent,render,screen } from "@testing-library/react";
import { afterEach,describe,it,expect } from "vitest";
import { MockStoreProvider } from "@/mocks/store";
import { Trail } from "./Trail";

const renderTrail=()=>render(<MockStoreProvider><Trail/></MockStoreProvider>);
afterEach(cleanup);

describe("Trail",()=>{
  it("renderiza cinco caminhos paralelos, recordes e nenhuma etapa bloqueada",()=>{renderTrail();for(const name of ["Empurrar","Puxar","Pernas","Core","Cardio"])expect(screen.getByRole("heading",{name})).toBeInTheDocument();expect(document.querySelectorAll(".journey-column")).toHaveLength(5);expect(screen.getAllByRole("button",{name:/Recorde de/})).toHaveLength(5);expect(screen.queryByText(/bloquead/i)).not.toBeInTheDocument();expect(screen.queryByText(/Próximo/i)).not.toBeInTheDocument()});
  it("seleciona e remove uma trilha e mostra cinco minutos",()=>{renderTrail();const push=screen.getByRole("button",{name:/Selecionar sugestão de Empurrar/});fireEvent.click(push);expect(screen.getByText("5 min")).toBeInTheDocument();expect(screen.getByRole("button",{name:/Remover sugestão de Empurrar/})).toHaveAttribute("aria-pressed","true");fireEvent.click(screen.getByRole("button",{name:/Remover sugestão de Empurrar/}));expect(screen.queryByRole("button",{name:"INICIAR"})).not.toBeInTheDocument()});
  it("limita a duas trilhas distintas e abre a prévia de dez minutos",()=>{renderTrail();fireEvent.click(screen.getByRole("button",{name:/Selecionar sugestão de Empurrar/}));fireEvent.click(screen.getByRole("button",{name:/Selecionar sugestão de Puxar/}));expect(screen.getByText("10 min")).toBeInTheDocument();expect(screen.getByRole("button",{name:/Selecionar sugestão de Pernas/})).toBeDisabled();fireEvent.click(screen.getByRole("button",{name:"INICIAR"}));expect(screen.getByRole("dialog",{name:"Sua sessão"})).toBeInTheDocument();expect(screen.getByText("SEU TREINO")).toBeInTheDocument()});
});
