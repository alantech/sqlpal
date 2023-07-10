import { HBox, align } from '../common';
import { DatabaseActions } from './DatabaseActions';

export function DatabaseManagement() {
  return (
    <HBox alignment={align.end}>
      <DatabaseActions />
    </HBox>
  );
}
