import React from 'react';
import moment from 'moment';
import { styled, View, Button, Text, ActivityIndicator } from 'bappo-components';
import EntryDetails from './EntryDetails';

class JobRows extends React.Component {
  state = {
    jobs: [],
    entries: [],
    entryMap: [],
    loading: true,
    selectedEntry: null,
  }

  componentDidMount() {
    this.fetchList();
  }

  createEntry = async (data) => {
    await this.props.$models.TimesheetEntry.create(data);
    this.fetchList();
  }

  fetchList = () => {
    this.setState({ loading: true }, async () => {
      const { $models, timesheet } = this.props;
      const jobs = [];
      const entryMap = [];

      const entries = await $models.TimesheetEntry.findAll({
        where: {
          timesheet_id: timesheet.id,
        },
        include: [
          { as: 'job' }
        ]
      });

      // Build entry map and track all involved jobs
      entries.forEach(e => {
        const dow = moment(e.date).day();
        if (!entryMap[e.job_id]) {
          entryMap[e.job_id] = [];
          jobs.push(e.job);
        }
        entryMap[e.job_id][dow] = e;
      });

      this.setState({ entries, entryMap, jobs, loading: false, selectedEntry: null });
    });
  }

  handleClickCell = (id, dayOfWeek, jobId) => {
    if (id) {
      // select an entry
      const selectedEntry = this.state.entries.find(e => e.id === id);
      this.setState({ selectedEntry });
    } else {
      // add new entry
      const { timesheet, $popup } = this.props;
      const date = moment(timesheet.weekStartingOn).add(dayOfWeek - 1, 'day').format('YYYY-MM-DD');
      $popup.form({
        formKey: 'TimesheetEntryForm',
        initialValues: {
          timesheet_id: timesheet.id,
          job_id: jobId,
          date,
        },
        onSubmit: this.createEntry,
      });
      this.setState({ selectedEntry: null });
    }
  }

  handleAddJob = () => {
    const addJobRow = (data) => {
      console.log(data);
    }

    const { $popup } = this.props;
    $popup.form({
      formKey: 'SelectJobForm',
      onSubmit: addJobRow,
    });
  }

  handleDeleteJobRow = async (jobId) => {
    const entriesToDelete = this.state.entryMap[jobId];
    const promiseArr = [];

    entriesToDelete.forEach(entry => {
      if (entry) {
        console.log(entry);
        promiseArr.push(this.props.$models.TimesheetEntry.destroyById(entry.id));
      }
    })

    await Promise.all(promiseArr);
    this.fetchList();
  }

  renderJobRow = (job) => {
    let total = 0;
    return (
      <JobRowContainer key={job.name}>
        <RowCell>
          <DeleteJobButton onPress={() => this.handleDeleteJobRow(parseInt(job.id))}>
            <DeleteButtonText>x</DeleteButtonText>
          </DeleteJobButton>
          <Text>{job.name}</Text>
        </RowCell>
        {
          Array
            .from({ length: 5 }, (v, i) => i+1)
            .map(dow => {
              const entry = this.state.entryMap[parseInt(job.id)][dow];
              let hourOfDay;
              if (entry) {
                hourOfDay = Number(entry.hours);
                total += hourOfDay;
              }

              return (
                <JobCell key={`${job.id}_${dow}`}>
                  <StyledButton
                    hasValue={!!entry}
                    onPress={() => this.handleClickCell(entry && entry.id, dow, job.id)}
                  >
                    <Text>{hourOfDay ? hourOfDay : 'Add'}</Text>
                  </StyledButton>
                </JobCell>
              );
            })
        }
        <TotalCell><Text>{total}</Text></TotalCell>
      </JobRowContainer>
    )
  }

  renderTotalRow = () => {
    const { jobs, entryMap } = this.state;
    let weekTotal = 0;

    return (
      <JobRowContainer>
        <Cell><Text>Total</Text></Cell>
        {
          Array
            .from({ length: 5 }, (v, i) => i+1)
            .map(dow => {
              let dayTotal = 0;
              jobs.forEach(job => {
                const entry = entryMap[parseInt(job.id)][dow];
                if (entry) {
                  dayTotal += Number(entry.hours);
                  weekTotal += Number(entry.hours);
                }
              });

              return (
                <TotalCell key={`${dow}_total`}>
                  <Text>{dayTotal}</Text>
                </TotalCell>
              );
            })
        }
        <TotalCell><Text>{weekTotal}</Text></TotalCell>
      </JobRowContainer>
    );
  }

  render() {
    const { jobs, selectedEntry, loading } = this.state;
    const { $popup, $models } = this.props;

    if (loading) return <ActivityIndicator />;

    return (
      <Container>
        { jobs.map(this.renderJobRow) }
        <NewJobButton onPress={this.handleAddJob}>
          <Text>New Job</Text>
        </NewJobButton>
        { this.renderTotalRow() }
        {
          selectedEntry &&
            <EntryDetails
              entry={selectedEntry}
              entryModel={$models.TimesheetEntry}
              fetchList={this.fetchList}
              $popup={$popup}
            />
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

const RowCell = styled(View)`
  flex: 1;
  flex-direction: row;
  justify-content: center;
`;

const JobCell = styled(Cell)`
  &:hover {
    background-color: #eee;
    >div {
      opacity: 0.7;
    }
  }
`;

const TotalCell = styled(Cell)`
  opacity: 0.5;
`;

const StyledButton = styled(Button)`
  align-self: stretch;
  align-items: center;
  ${props => !props.hasValue &&
    'opacity: 0;'}
`;

const DeleteJobButton = styled(Button)`
  margin-right: 10px;
`;

const DeleteButtonText = styled(Text)`
  color: red;
`;

const NewJobButton = styled(Button)`
  width: 14.3%;
  align-items: center;
  margin-bottom: 7px;
`;
