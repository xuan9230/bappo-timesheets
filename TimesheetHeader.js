import React from 'react';
import { styled, Text } from 'bappo-components';

const TimesheetHeader = ({
  timesheet,
}) => {
  if (!timesheet) return null;
  return (
    <Container>
      {`${timesheet.person.name}'s Timesheet`}
    </Container>
  );
};

export default TimesheetHeader;

const Container = styled(Text)`
  font-size: 18px;
  margin: 15px;
`;
