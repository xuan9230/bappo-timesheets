import React from 'react';
import moment from 'moment';
import { styled, View, Button, ActivityIndicator } from 'bappo-components';
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
      const jobs = await $models.Job.findAll();

      // Initialize work time map of the week
      const entryMap = [];
      jobs.forEach(job => entryMap[parseInt(job.id)] = []);
      entryMap.forEach(m => m.push(0, 0, 0, 0, 0));

      const entries = await $models.TimesheetEntry.findAll({
        where: {
          timesheet_id: timesheet.id,
        },
        // include: [
        //   { as: 'employee' },
        //   { as: 'job' }
        // ]
      });

      entries.forEach(e => {
        const dow = moment(e.date).day();
        entryMap[parseInt(e.job_id)][dow] = e;
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

  renderJobRow = (job) => {
    let total = 0;
    return (
      <JobRowContainer key={job.name}>
        <Cell>{job.name}</Cell>
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
                    onPress={() => this.handleClickCell(entry.id, dow, job.id)}
                  >
                    {hourOfDay ? hourOfDay : 'Add'}
                  </StyledButton>
                </JobCell>
              );
            })
        }
        <TotalCell>{total}</TotalCell>
      </JobRowContainer>
    )
  }

  renderTotalRow = () => {
    const { jobs, entryMap } = this.state;
    let weekTotal = 0;

    return (
      <JobRowContainer>
        <Cell>Total</Cell>
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
                  {dayTotal}
                </TotalCell>
              );
            })
        }
        <TotalCell>{weekTotal}</TotalCell>
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
