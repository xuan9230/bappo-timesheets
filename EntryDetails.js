import React from 'react';
import { styled, View, Text, Button } from 'bappo-components';

const EntryDetails = ({
  entry,
  entryModel,
  fetchList,
  $popup,
}) => {
  const updateEntry = async (data) => {
    await entryModel.update(data);
    fetchList();
  }

  const deleteEntry = async () => {
    await entryModel.destroyById(entry.id);
    fetchList();
  }

  const openEditForm = () => {
    $popup.form({
      formKey: 'TimesheetEntryForm',
      initialValues: entry,
      onSubmit: updateEntry,
    });
  }

  return (
    <Container>
      <NameContainer>
        <FieldName>Notes</FieldName>
      </NameContainer>
      <ValueContainer>
        <FieldValue>{entry.notes}</FieldValue>
        <ButtonsContainer>
          <EditButton onPress={openEditForm}>Edit</EditButton>
          <EditButton onPress={deleteEntry}>Delete</EditButton>
        </ButtonsContainer>
      </ValueContainer>
    </Container>
  );
};

export default EntryDetails;

const Container = styled(View)`
  margin: 20px;
  flex-direction: row;
`;

const NameContainer = styled(View)`
  flex-basis: 30%;
  align-items: flex-end;
`;

const FieldName = styled(Text)`
  font-weight: bold;
  margin-right: 20px;
`;

const ValueContainer = styled(View)`
  flex-basis: 70%;
`;

const FieldValue = styled(Text)`
`;

const ButtonsContainer = styled(View)`
  flex-direction: row;
  margin-top: 20px;
`;

const EditButton = styled(Button)`
  padding: 7px;
  border-style: solid;
  border-radius: 4px;
  border-width: 0.5px;
  border-color: #ccc;
  margin-right: 20px;
`;
