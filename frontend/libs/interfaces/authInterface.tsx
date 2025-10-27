import {
  HistorialCambio,
  Refineria,
  UserReference,
} from "./configRefineriaInterface";

export interface AuthContextProps {
  children: React.ReactNode;
}

export interface AuthState {
  status: "checking" | "authenticated" | "not-authenticated";
  user: User | null;
  token: string | null;
}

interface User {
  uid: string;
  name: string;
  email: string;
}

export interface Usuario {
  id: string;
  nombre: string;
  correo: string;
  rol: string;
  acceso: string;
  estado: string;
  createdBy: UserReference;
  modificadoPor: UserReference;
  createdAt: string;
  historial: HistorialCambio[];
  idRefineria?: Refineria[];
  departamento?: string[];
  img?: string;
  telefono: string;
}
