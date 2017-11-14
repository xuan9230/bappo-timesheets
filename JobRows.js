import React from 'react';
import moment from 'moment';
import { styled, View, Text, Button } from 'bappo-components';

class JobRows extends React.Component {
  state = {
    jobs: [],
    timeMap: [],
    loading: true,
  }

  componentDidMount() {
    this.fetchList();
  }

  fetchList = async () => {
    const { $models, $navigation } = this.props;
    const { recordId } = $navigation.state.params;
    const jobs = await $models.Job.findAll();

    // Initialize work time map of the week
    const timeMap = [];
    jobs.forEach(job => timeMap[parseInt(job.id)] = []);
    timeMap.forEach(m => m.push(0, 0, 0, 0, 0));

    const entries = await $models.TimesheetEntry.findAll({
      where: {
        timesheet_id: recordId,
      },
      // include: [
      //   { as: 'employee' },
      //   { as: 'job' }
      // ]
    });

    entries.forEach(e => {
      const dow = moment(e.date).day();
      timeMap[parseInt(e.job_id)][dow] += parseInt(e.hours);
    });

    this.setState({ timeMap, jobs, loading: false });
  }

  openForm = () => {
    const { $popup } = this.props;
    console.log($popup);
  }

  renderJobRow = (job) => {
    let total = 0;
    return (
      <JobRowContainer key={job.name}>
        <Cell>{job.name}</Cell>
        {
          Array
            .from({ length: 5 }, (v, i) => i+1)
            .map(i => {
              const hourOfDay = this.state.timeMap[parseInt(job.id)][i];
              if (hourOfDay) total += hourOfDay;
              return (
                <Cell key={`${job.id}_${i}`}>
                  <Button onPress={this.openForm}>
                    {hourOfDay ? hourOfDay : ''}
                  </Button>
                </Cell>
              );
            })
        }
        <Cell>{total}</Cell>
      </JobRowContainer>
    )
  }

  render() {
    const { jobs, timeMap, loading } = this.state;

    if (loading) return <Text>Loading...</Text>;

    console.log(this.state.timeMap)
    return (
      <Container>
        {
          jobs.map(this.renderJobRow)
        }
      </Container>
    );
  }
}

export default JobRows;

const Container = styled(View)`

`;

const JobRowContainer = styled(View)`
  flex-direction: row;
  margin-bottom: 7px;
`;

const Cell = styled(View)`
  flex: 1;
  align-items: center;
`;
