import { cleanup,fireEvent,render,screen,within } from "@testing-library/react";
import { afterEach,describe,it,expect } from "vitest";
import { MockStoreProvider } from "@/mocks/store";
import { Trail } from "./Trail";

const renderTrail=()=>render(<MockStoreProvider><Trail/></MockStoreProvider>);
afterEach(cleanup);

describe("Trail",()=>{
  it("mostra as cinco jornadas, históricos diferentes, recordes e recomendações",()=>{
    renderTrail();
    for(const name of ["Empurrar","Puxar","Pernas","Core","Cardio"])expect(screen.getByRole("heading",{name})).toBeInTheDocument();
    expect(screen.getAllByLabelText(/Prática realizada|Recorde de/)).toHaveLength(24);
    expect(screen.getByRole("button",{name:/Recorde de Empurrar: 80/})).toBeInTheDocument();
    expect(screen.getByRole("button",{name:/Iniciar Cardio, recomendação de 40/})).toBeInTheDocument();
  });

  it("revela o recorde e inicia uma capacidade pelo toque",()=>{
    renderTrail();fireEvent.click(screen.getByRole("button",{name:/Recorde de Empurrar/}));
    expect(screen.getByRole("status")).toHaveTextContent("Recorde · 80 repetições");
    fireEvent.click(screen.getByRole("button",{name:/Iniciar Empurrar/}));
    expect(screen.getByRole("dialog",{name:"Sua sessão"})).toBeInTheDocument();
    expect(screen.getByText("Flexão de braço")).toBeInTheDocument();
    expect(screen.getByText("70 repetições")).toBeInTheDocument();
  });

  it("compõe três capacidades por toque e repete sem gesto oculto",()=>{
    renderTrail();fireEvent.click(screen.getByRole("button",{name:"INICIAR TREINO"}));
    fireEvent.click(screen.getByRole("button",{name:/Iniciar Empurrar/}));
    fireEvent.click(screen.getByRole("button",{name:/Iniciar Puxar/}));
    fireEvent.click(screen.getByRole("button",{name:/Iniciar Core/}));
    fireEvent.click(screen.getByRole("button",{name:"Aumentar Empurrar"}));
    expect(screen.getByLabelText("Participações de Empurrar")).toHaveTextContent("2×");
    expect(screen.getByText("Empurrar · Puxar · Core · Empurrar")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button",{name:/ORGANIZAR SESSÃO/}));
    const sequence=screen.getByRole("list");
    expect(within(sequence).getAllByText("Empurrar")).toHaveLength(2);
  });
});
