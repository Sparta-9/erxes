import { IContext } from "@erxes/api-utils";
import { moduleCheckPermission } from "@erxes/api-utils/src/permissions";
import { ResponseTemplates } from "../../models";
import { IResponseTemplate } from "../../models/definitions/responseTemplates";

interface IResponseTemplatesEdit extends IResponseTemplate {
  _id: string;
}

const responseTemplateMutations = {
  /**
   * Creates a new response template
   */
  async responseTemplatesAdd(
    _root,
    doc: IResponseTemplate,
    { user, docModifier }: IContext
  ) {
    const template = await ResponseTemplates.create(docModifier(doc));

    return template;
  },

  /**
   * Updates a response template
   */
  async responseTemplatesEdit(
    _root,
    { _id, ...fields }: IResponseTemplatesEdit,
    { user }: IContext
  ) {
    const template = await ResponseTemplates.getResponseTemplate(_id);
    const updated = await ResponseTemplates.updateResponseTemplate(_id, fields);

    return updated;
  },

  /**
   * Deletes a response template
   */
  async responseTemplatesRemove(
    _root,
    { _id }: { _id: string },
    { user }: IContext
  ) {
    const template = await ResponseTemplates.getResponseTemplate(_id);
    const removed = await ResponseTemplates.removeResponseTemplate(_id);

    return removed;
  }
};

moduleCheckPermission(responseTemplateMutations, 'manageResponseTemplate');

export default responseTemplateMutations;