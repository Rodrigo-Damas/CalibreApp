export type Scenario = "filled" | "empty" | "locked" | "completed" | "error";
export type Exercise = { id:string; name:string; group:string; icon:string };
export const exercises: Exercise[] = [
 {id:"squat",name:"Agachamento",group:"Pernas",icon:"🏋️"},{id:"legpress",name:"Leg press",group:"Pernas",icon:"🦵"},{id:"extension",name:"Cadeira extensora",group:"Pernas",icon:"🦵"},{id:"curl",name:"Mesa flexora",group:"Pernas",icon:"🦵"},{id:"row",name:"Remada",group:"Costas",icon:"🚣"},{id:"pulldown",name:"Puxada",group:"Costas",icon:"🏋️"},{id:"press",name:"Supino",group:"Peito",icon:"🏋️"},{id:"pushup",name:"Flexão",group:"Peito",icon:"💪"},{id:"biceps",name:"Rosca bíceps",group:"Braços",icon:"💪"},{id:"triceps",name:"Tríceps na polia",group:"Braços",icon:"💪"},{id:"shoulderpress",name:"Desenvolvimento",group:"Ombros",icon:"🏋️"},{id:"calf",name:"Elevação de panturrilha",group:"Pernas",icon:"🦵"},{id:"crunch",name:"Abdominal",group:"Abdômen",icon:"⚡"},{id:"hipthrust",name:"Elevação pélvica",group:"Glúteos",icon:"🏋️"}
];
export const scenarios = {
 filled:{stage:2,xp:180,streak:3,records:[{id:"r1",stage:0,date:"18 set",sets:9,xp:80},{id:"r2",stage:1,date:"20 set",sets:12,xp:100}]},
 empty:{stage:0,xp:0,streak:0,records:[]}, locked:{stage:0,xp:0,streak:0,records:[]},
 completed:{stage:5,xp:520,streak:5,records:[{id:"r1",stage:4,date:"Hoje",sets:12,xp:100}]},
 error:{stage:2,xp:180,streak:3,records:[],error:"Não foi possível carregar os dados simulados."}
} satisfies Record<Scenario,{stage:number;xp:number;streak:number;records:{id:string;stage:number;date:string;sets:number;xp:number}[];error?:string}>;
