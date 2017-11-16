import React from 'react';
import moment from 'moment';
import { styled, View, Button, Text, ActivityIndicator } from 'bappo-components';
import EntryDetails from './EntryDetails';

class JobRows extends React.Component {
  state = {
    // Jobs dictionary: id-instance pairs
    jobs: {},
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
    const { $models, timesheet } = this.props;

    this.setState({ loading: true}, async () => {
      //Fetch Entries
      const entries = await $models.TimesheetEntry.findAll({
        where: {
          timesheet_id: timesheet.id,
        },
        include: [
          { as: 'job' }
        ]
      });

      // Set new state
      this.setState((state) => {
        const { jobs } = state;
        const { $models, timesheet } = this.props;
        const entryMap = [];

        // Build entry map and track all involved jobs
        entries.forEach(e => {
          const dow = moment(e.date).day();
          if (!entryMap[e.job_id]) {
            entryMap[e.job_id] = [];
            jobs[e.job.id] = e.job;
          }
          entryMap[e.job_id][dow] = e;
        });

        return {
          ...state,
          entryMap,
          entries,
          jobs,
          loading: false,
        };
      });
    })
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
    const { $models, $popup } = this.props;

    const addJobRow = async (data) => {
      if (this.state.jobs[data.job_id]) return;

      const job = await $models.Job.findById(data.job_id);
      this.setState((state) => {
        const { jobs, entryMap } = state;
        if (!entryMap[job.id]) {
          entryMap[job.id] = [];
        }
        jobs[job.id] = job;
        return {
          ...state,
          jobs,
          entryMap,
        };
      })
    }

    $popup.form({
      formKey: 'SelectJobForm',
      onSubmit: addJobRow,
    });
  }

  handleDeleteJobRow = async (jobId) => {
    const entriesToDelete = this.state.entryMap[jobId];
    const promiseArr = [];

    // Delete all related entries
    entriesToDelete.forEach(entry => {
      if (entry) {
        promiseArr.push(this.props.$models.TimesheetEntry.destroyById(entry.id));
      }
    })
    await Promise.all(promiseArr);

    // Remove the job row
    this.setState((state) => {
      const { jobs } = state;
      delete jobs[jobId];
      return {
        ...state,
        jobs,
      };
    }, () => this.fetchList());
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
              const entry = this.state.entryMap[job.id][dow];
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
        <Cell><Text>{total}</Text></Cell>
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
              Object.keys(jobs).forEach(jobId => {
                const entry = entryMap[jobId][dow];
                if (entry) {
                  dayTotal += Number(entry.hours);
                  weekTotal += Number(entry.hours);
                }
              });

              return (
                <Cell key={`${dow}_total`}>
                  <Text>{dayTotal}</Text>
                </Cell>
              );
            })
        }
        <Cell><Text>{weekTotal}</Text></Cell>
      </JobRowContainer>
    );
  }

  render() {
    const { jobs, selectedEntry, loading } = this.state;
    const { $popup, $models } = this.props;

    if (loading) return <ActivityIndicator />;

    return (
      <Container>
        { Object.keys(jobs).map(jobId => this.renderJobRow(jobs[jobId])) }
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
  align-items: center;
`;

const Cell = styled(View)`
  margin: 5px;
  flex: 1;
  align-items: center;
`;

const RowCell = styled(View)`
  margin: 5px;
  flex: 1;
  flex-direction: row;
  justify-content: center;
`;

const JobCell = styled(Cell)`
  background-color: #eee;
  &:hover {
    >div {
      opacity: 0.7;
    }
  }
`;

const StyledButton = styled(Button)`
  align-self: stretch;
  align-items: center;
  ${props => !props.hasValue &&
    'opacity: 0;'}
`;

const DeleteJobButton = styled(Button)`
  margin-right: 5px;
`;

const DeleteButtonText = styled(Text)`
  color: red;
`;

const NewJobButton = styled(Button)`
  width: 14.3%;
  align-items: center;
`;
