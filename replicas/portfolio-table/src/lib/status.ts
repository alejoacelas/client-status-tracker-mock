import type { StatusKey } from '../data/mock';

export interface StatusMeta {
  key: StatusKey;
  label: string;
  dot: string;
  bg: string;
  text: string;
  bar: string; // top border colour on status cards and composer
}

// Colours sampled from public help-centre screenshots of the original.
export const STATUS: Record<StatusKey, StatusMeta> = {
  on_track: { key: 'on_track', label: 'On track', dot: '#5da283', bg: '#e3f6ec', text: '#357a5b', bar: '#5da283' },
  at_risk: { key: 'at_risk', label: 'At risk', dot: '#f1bd6c', bg: '#fdf2e1', text: '#946016', bar: '#f1bd6c' },
  off_track: { key: 'off_track', label: 'Off track', dot: '#f06a6a', bg: '#fde9eb', text: '#c4364e', bar: '#f06a6a' },
  on_hold: { key: 'on_hold', label: 'On hold', dot: '#4573d2', bg: '#e8eefb', text: '#3a63ba', bar: '#4573d2' },
  complete: { key: 'complete', label: 'Complete', dot: '#ffffff', bg: '#5da283', text: '#ffffff', bar: '#5da283' },
  dropped: { key: 'dropped', label: 'Dropped', dot: '#a2a0a2', bg: '#efedec', text: '#6d6e6f', bar: '#a2a0a2' },
};

export const STATUS_ORDER: StatusKey[] = ['on_track', 'at_risk', 'off_track', 'on_hold', 'complete', 'dropped'];
