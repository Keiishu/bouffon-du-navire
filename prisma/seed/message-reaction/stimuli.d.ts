export interface Stimulus {
  message: string;
  keyword?: boolean;
  reactions: string[];
}

export type Stimuli = Stimulus[];
