import {FixedValue} from "./fixed-value.model";

export interface LumpSum {
    id?: string;
    name: string;
    fixedValues: FixedValue[];
}