export interface Stimulus {
  message: string;
  keyword?: boolean;
  stickers: boolean;
  reactions: string[];
}

export type Stimuli = Stimulus[];
