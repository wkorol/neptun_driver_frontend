import {Tariff} from "./tariff.model";

export interface FixedValue {
    name: string;
    tariff1: Tariff;
    tariff2: Tariff;
}