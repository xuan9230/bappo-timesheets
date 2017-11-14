import React from 'react';
import { styled, View, Text } from 'bappo-components';

const values = [
  'Job',
  'Mon',
  'Tue',
  'Wed',
  'Thu',
  'Fri',
  'Total'
];

const RowHeader = ({
  data
}) => {
  const cells = values.map(v => <Cell key={v}>{v}</Cell>);
  return (
    <RowContainer>
      {cells}
      <Divider />
    </RowContainer>
  );
}

export default RowHeader;

const RowContainer = styled(View)`
  flex-direction: row;
  margin-top: 10px;
  margin-bottom: 15px;
`;

const Cell = styled(Text)`
  font-weight: bold;
  flex: 1;
  display: flex;
  justify-content: center;
`;

const Divider = styled(View)`
  position: absolute;
  bottom: -7px;
  width: 100%;
  height: 1px;
  background-color: #ccc;
`;
