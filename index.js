import React from 'react';
import { styled, View, Text } from 'bappo-components';
import TimesheetHeader from './TimesheetHeader';
import RowHeader from './RowHeader';
import JobRows from './JobRows';

class TableView extends React.Component {
  state = {
    timesheet: null,
  }

  async componentDidMount() {
    const { $navigation, $models } = this.props;
    const { recordId } = $navigation.state.params;
    const timesheet = (await $models.Timesheet.findAll({
      where: {
        id: recordId,
      },
      include: [
        { as: 'person' }
      ]
    }))[0];
    this.setState({ timesheet });
  }

  render() {
    return (
      <Container>
        <TimesheetHeader timesheet={this.state.timesheet} />
      </Container>
    );
  }
}


// const TableView = ({
//   ...props
// }) => {
//   const { recordId } = props.$navigation.state.params;

//   return (
//     <Container>
//       <TimeSheetHeader recordId={recordId} />
//       <RowHeader />
//       <JobRows
//         {...props}
//       />
//     </Container>
//   );
// }

export default TableView;

const Container = styled(View)`
`;
