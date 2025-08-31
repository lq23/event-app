import { Role } from "./roles";
export interface User {
    id: string;
    name: string;
    role: Role;
    [key: string]: any; 
}