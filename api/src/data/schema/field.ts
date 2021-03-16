export const fieldsTypes = `
  type Logic {
    fieldId: String!
    willShow: Boolean
    logicOperator: String
    logicValue: JSON
  }

  type Field {
    _id: String!
    contentType: String!
    contentTypeId: String
    type: String
    validation: String
    text: String
    name: String
    description: String
    options: [String]
    isRequired: Boolean
    order: Int
    isVisible: Boolean
    isDefinedByErxes: Boolean
    groupId: String
    lastUpdatedUser: User
    lastUpdatedUserId: String
    associatedFieldId: String
    associatedField: Field
    logic: Logic
  }

  input OrderItem {
    _id: String!
    order: Int!
  }

  input LogicInput {
    fieldId: String
    tempFieldId: String
    willShow: Boolean
    logicOperator: String
    logicValue: JSON
  }

  input FieldItem {
    _id: String
    tempFieldId: String
    type: String
    validation: String
    text: String
    description: String
    options: [String]
    isRequired: Boolean
    order: Int
    associatedFieldId: String
    logic: LogicInput
  }

  type ColumnConfigItem {
    name: String
    label: String
    order: Int
  }
`;

export const fieldsQueries = `
  fields(contentType: String!, contentTypeId: String, isVisible: Boolean): [Field]
  fieldsCombinedByContentType(contentType: String!, usageType: String, excludedNames: [String]): JSON
  fieldsDefaultColumnsConfig(contentType: String!): [ColumnConfigItem]
`;

const fieldsCommonFields = `
  type: String
  validation: String
  text: String
  description: String
  options: [String]
  isRequired: Boolean
  order: Int
  groupId: String
  isVisible: Boolean
  associatedFieldId: String
  logic: LogicInput
`;

export const fieldsMutations = `
  fieldsAdd(contentType: String!, contentTypeId: String, ${fieldsCommonFields}): Field
  fieldsBulkAddAndEdit(contentType: String!, contentTypeId: String, addingFields:[FieldItem], editingFields:[FieldItem]): [Field]
  fieldsEdit(_id: String!, ${fieldsCommonFields}): Field
  fieldsRemove(_id: String!): Field
  fieldsUpdateOrder(orders: [OrderItem]): [Field]
  fieldsUpdateVisible(_id: String!, isVisible: Boolean) : Field
`;

export const fieldsGroupsTypes = `
  type FieldsGroup {
    _id: String!
    name: String
    contentType: String
    order: Int
    description: String
    isVisible: Boolean
    isDefinedByErxes: Boolean
    fields: [Field]
    lastUpdatedUserId: String
    lastUpdatedUser: User
  }
`;

const fieldsGroupsCommonFields = `
  name: String
  contentType: String
  order: Int
  description: String
  isVisible: Boolean
`;

export const fieldsGroupsQueries = `
  fieldsGroups(contentType: String): [FieldsGroup]
  getFields(contentType: String): [Field]
`;

export const fieldsGroupsMutations = `
  fieldsGroupsAdd(${fieldsGroupsCommonFields}): FieldsGroup
  fieldsGroupsEdit(_id: String!, ${fieldsGroupsCommonFields}): FieldsGroup
  fieldsGroupsRemove(_id: String!): JSON
  fieldsGroupsUpdateVisible(_id: String, isVisible: Boolean) : FieldsGroup
`;
