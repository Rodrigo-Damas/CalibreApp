import { cleanup,fireEvent,render,screen } from "@testing-library/react";
import { afterEach,describe,it,expect } from "vitest";
import { prescribedPractice, type Effort } from "@/mocks/data";
import { adaptedVolume, MockStoreProvider } from "@/mocks/store";
import { alternatePractices } from "./WorkoutFlow";
import { Trail } from "@/features/trail/Trail";
afterEach(cleanup);

describe("prescrição e adaptação",()=>{
  it("alterna ocorrências e escolhe automaticamente exercícios básicos",()=>{
    const queue=alternatePractices([prescribedPractice("push",0),prescribedPractice("push",1),prescribedPractice("pull",0),prescribedPractice("pull",1)]);
    expect(queue.map(item=>item.track)).toEqual(["push","pull","push","pull"]);
    expect(queue.map(item=>item.name)).toEqual(["Flexão de braço","Remada australiana","Flexão de braço","Remada australiana"]);
  });
  it("aceita todas as seis respostas de esforço e pode subir, manter ou reduzir",()=>{
    const efforts:Effort[]=["Muito fáceis","Fáceis","Moderadas","Difíceis","Muito difíceis","Não completei"];
    expect(efforts.map(effort=>adaptedVolume(100,effort))).toEqual([115,110,105,100,90,80]);
    expect(adaptedVolume(100,"Moderadas","Em parte")).toBe(103);
    expect(adaptedVolume(100,"Moderadas","Não fiz")).toBe(100);
  });
  it("oferece aceitar e recusar a sugestão separada da prática",()=>{
    render(<MockStoreProvider><Trail/></MockStoreProvider>);fireEvent.click(screen.getByRole("button",{name:/Iniciar Empurrar/}));fireEvent.click(screen.getByRole("button",{name:/COMEÇAR SESSÃO/}));
    expect(screen.getByText(/primeiras 10 como flexão diamante/i)).toBeInTheDocument();
    expect(screen.getByRole("button",{name:"ACEITAR SUGESTÃO"})).toBeInTheDocument();
    expect(screen.getByRole("button",{name:"MANTER PRÁTICA PADRÃO"})).toBeInTheDocument();
  });
});
