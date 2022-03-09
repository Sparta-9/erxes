import { ICustomer } from "../../models/definitions/customers";
import messageBroker from "../../messageBroker";
import { MODULE_NAMES } from "../../constants";
import { putCreateLog, putDeleteLog, putUpdateLog } from "../../logUtils";
import { checkPermission } from "@erxes/api-utils/src/permissions";
import { validateBulk } from "../../verifierUtils";
import { sendMessage } from "../../messageBroker";
import { IContext } from "../../connectionResolver";

interface ICustomersEdit extends ICustomer {
  _id: string;
}

const customerMutations = {
  /**
   * Create new customer also adds Customer registration log
   */
  async customersAdd(
    _root,
    doc: ICustomer,
    { user, docModifier, models }: IContext
  ) {
    const modifiedDoc = docModifier(doc);

    const customer = await models.Customers.createCustomer(modifiedDoc, user);

    await putCreateLog(
      models,
      {
        type: MODULE_NAMES.CUSTOMER,
        newData: modifiedDoc,
        object: customer,
      },
      user
    );

    sendMessage("registerOnboardHistory", {
      type: `${customer.state}Create`,
      user,
    });

    return customer;
  },

  /**
   * Updates a customer
   */
  async customersEdit(
    _root,
    { _id, ...doc }: ICustomersEdit,
    { user, models }: IContext
  ) {
    const customer = await models.Customers.getCustomer(_id);
    const updated = await models.Customers.updateCustomer(_id, doc);

    await putUpdateLog(
      models,
      {
        type: MODULE_NAMES.CUSTOMER,
        object: customer,
        newData: doc,
        updatedDocument: updated,
      },
      user
    );

    return updated;
  },

  /**
   * Change state
   */
  async customersChangeState(
    _root,
    args: { _id: string; value: string },
    { models: { Customers } }: IContext
  ) {
    return Customers.changeState(args._id, args.value);
  },

  /**
   * Merge customers
   */
  async customersMerge(
    _root,
    {
      customerIds,
      customerFields,
    }: { customerIds: string[]; customerFields: ICustomer },
    { user, models: { Customers } }: IContext
  ) {
    return Customers.mergeCustomers(customerIds, customerFields, user);
  },

  /**
   * Remove customers
   */
  async customersRemove(
    _root,
    { customerIds }: { customerIds: string[] },
    { user, models }: IContext
  ) {
    const customers = await models.Customers.find({
      _id: { $in: customerIds },
    }).lean();

    await models.Customers.removeCustomers(customerIds);

    await messageBroker().sendMessage("erxes-api:integrations-notification", {
      type: "removeCustomers",
      customerIds,
    });

    for (const customer of customers) {
      await putDeleteLog(
        models,
        { type: MODULE_NAMES.CUSTOMER, object: customer },
        user
      );

      if (customer.mergedIds) {
        await messageBroker().sendMessage(
          "erxes-api:integrations-notification",
          {
            type: "removeCustomers",
            customerIds: customer.mergedIds,
          }
        );
      }
    }

    return customerIds;
  },

  async customersVerify(
    _root,
    { verificationType }: { verificationType: string },
    { models }: IContext
  ) {
    await validateBulk(models, verificationType);
  },

  async customersChangeVerificationStatus(
    _root,
    args: { customerIds: [string]; type: string; status: string },
    { models: { Customers } }: IContext
  ) {
    return Customers.updateVerificationStatus(
      args.customerIds,
      args.type,
      args.status
    );
  },
};

checkPermission(customerMutations, "customersAdd", "customersAdd");
checkPermission(customerMutations, "customersEdit", "customersEdit");
checkPermission(customerMutations, "customersMerge", "customersMerge");
checkPermission(customerMutations, "customersRemove", "customersRemove");
checkPermission(
  customerMutations,
  "customersChangeState",
  "customersChangeState"
);

export default customerMutations;