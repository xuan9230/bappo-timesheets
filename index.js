import React from 'react';
import moment from 'moment';
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

  switchWeek = async (isNext) => {
    const { $navigation, $models } = this.props;
    const { timesheet } = this.state;

    const weekGap = isNext ? 1 : -1;
    const targetWeekStartingOn = moment(timesheet.weekStartingOn).add(weekGap, 'week').format('YYYY-MM-DD');

    let targetTimesheet;
    targetTimesheet = await $models.Timesheet.findOne({
      where: {
        weekStartingOn: targetWeekStartingOn,
        person_id: timesheet.person_id,
      },
    });

    if (!targetTimesheet) {
      // create new time sheet
      targetTimesheet = await $models.Timesheet.create({
        weekStartingOn: targetWeekStartingOn,
        person_id: timesheet.person_id,
      });
    }
    // navigate to target week
    $navigation.navigate('TimesheetDetailsPage', { recordId: targetTimesheet.id });
  }

  render() {
    const { timesheet } = this.state;
    if (!timesheet) return null;

    return (
      <Container>
        <TimesheetHeader
          timesheet={timesheet}
          switchWeek={this.switchWeek}
        />
        <RowHeader startDate={timesheet.weekStartingOn} />
        <JobRows
          timesheet={timesheet}
          {...this.props}
        />
      </Container>
    );
  }
}

export default TableView;

const Container = styled(View)`
`;
