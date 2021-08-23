import { __, Alert } from 'modules/common/utils';
import { jsPlumb } from 'jsplumb';
import jquery from 'jquery';
import RTG from 'react-transition-group';
import Wrapper from 'modules/layout/components/Wrapper';
import React from 'react';
import Form from 'modules/common/components/form/Form';
import { IAction, IAutomation, ITrigger, IAutomationNote } from '../../types';
import {
  Container,
  CenterFlexRow,
  BackButton,
  Title,
  RightDrawerContainer,
  AutomationFormContainer,
  ScrolledContent,
  BackIcon,
  CenterBar,
  ToggleWrapper
} from '../../styles';
import { FormControl } from 'modules/common/components/form';
import { BarItems, HeightedWrapper } from 'modules/layout/styles';
import Button from 'modules/common/components/Button';
import TriggerForm from '../../containers/forms/triggers/TriggerForm';
import ActionsForm from '../../containers/forms/actions/ActionsForm';
import TriggerDetailForm from './triggers/TriggerDetailForm';
import {
  createInitialConnections,
  connection,
  deleteConnection,
  sourceEndpoint,
  targetEndpoint,
  connectorPaintStyle,
  connectorHoverStyle,
  hoverPaintStyle,
  yesEndPoint,
  noEndPoint
} from 'modules/automations/utils';
import ActionDetailForm from './actions/ActionDetailForm';
import Icon from 'modules/common/components/Icon';
import PageContent from 'modules/layout/components/PageContent';
import { Link } from 'react-router-dom';
import { Tabs, TabTitle } from 'modules/common/components/tabs';
import Toggle from 'modules/common/components/Toggle';
import SettingsContainer from 'modules/automations/containers/forms/settings/Settings';
import Modal from 'react-bootstrap/Modal';
import NoteFormContainer from 'modules/automations/containers/forms/NoteForm';
import TemplateForm from '../../containers/forms/TemplateForm';

const plumb: any = jsPlumb;
let instance;

type Props = {
  id?: string;
  automation?: IAutomation;
  automationNotes?: IAutomationNote[];
  save: (params: any) => void;
};

type State = {
  name: string;
  status: string;
  currentTab: string;
  showDrawer: boolean;
  showTrigger: boolean;
  showAction: boolean;
  isActionTab: boolean;
  isActive: boolean;
  showNoteForm: boolean;
  showTemplateForm: boolean;
  actions: IAction[];
  triggers: ITrigger[];
  activeTrigger: ITrigger;
  activeAction: IAction;
  selectedContentId?: string;
};

class AutomationForm extends React.Component<Props, State> {
  private wrapperRef;

  constructor(props) {
    super(props);

    const {
      automation = {
        name: 'Your automation title',
        status: 'draft',
        triggers: [],
        actions: []
      }
    } = this.props;

    this.state = {
      name: automation.name,
      status: automation.status,
      actions: automation.actions || [],
      triggers: automation.triggers || [],
      activeTrigger: {} as ITrigger,
      currentTab: 'triggers',
      isActionTab: true,
      isActive: automation.status === 'active',
      showNoteForm: false,
      showTemplateForm: false,
      showTrigger: false,
      showDrawer: false,
      showAction: false,
      activeAction: {} as IAction
    };
  }

  setWrapperRef = node => {
    this.wrapperRef = node;
  };

  componentDidMount() {
    this.connectInstance();

    document.addEventListener('click', this.handleClickOutside, true);
  }

  componentDidUpdate(prevProps, prevState) {
    const { isActionTab } = this.state;

    if (isActionTab && isActionTab !== prevState.isActionTab) {
      this.connectInstance();
    }
  }

  componentWillUnmount() {
    document.removeEventListener('click', this.handleClickOutside, true);
  }

  connectInstance = () => {
    instance = plumb.getInstance({
      DragOptions: { cursor: 'pointer', zIndex: 2000 },
      PaintStyle: connectorPaintStyle,
      HoverPaintStyle: connectorHoverStyle,
      EndpointStyle: { radius: 10 },
      EndpointHoverStyle: hoverPaintStyle,
      ConnectionOverlays: [
        [
          'Arrow',
          {
            location: 1,
            visible: true,
            width: 15,
            length: 15,
            id: 'ARROW'
          }
        ]
      ],
      Container: 'canvas'
    });

    instance.bind('ready', () => {
      const { triggers, actions } = this.state;

      instance.bind('connection', info => {
        this.onConnection(info);
      });

      instance.bind('connectionDetached', info => {
        this.onDettachConnection(info);
      });

      for (const action of actions) {
        this.renderControl('action', action, this.onClickAction);
      }

      for (const trigger of triggers) {
        this.renderControl('trigger', trigger, this.onClickTrigger);
      }

      // create connections ===================
      createInitialConnections(triggers, actions, instance);

      // delete connections ===================
      deleteConnection(instance);

      // toggle action control when click mouse 2 ===================
      jquery('#canvas').on('contextmenu', '.control', event => {
        event.preventDefault();

        jquery(`div#${event.currentTarget.id}`).toggleClass('show-action-menu');
      });

      // remove action control =============
      jquery('#canvas').bind('click', () => {
        jquery('div.control').removeClass('show-action-menu');
      });

      // delete control ===================
      jquery('#canvas').on('click', '.delete-control', event => {
        event.preventDefault();

        const item = event.currentTarget.id;
        const splitItem = item.split('-');
        const type = splitItem[0];

        instance.remove(item);

        if (type === 'action') {
          return this.setState({
            actions: actions.filter(action => action.id !== splitItem[1])
          });
        }

        if (type === 'trigger') {
          return this.setState({
            triggers: triggers.filter(trigger => trigger.id !== splitItem[1])
          });
        }
      });

      // add note ===================
      jquery('#canvas').on('click', '.add-note', event => {
        event.preventDefault();

        this.handleNoteModal();
      });
    });
  };

  handleSubmit = (e: React.FormEvent, isSaveAs?: boolean) => {
    e.preventDefault();

    const { name, status, triggers, actions } = this.state;
    const { id, save } = this.props;

    if (!name) {
      return Alert.error('Enter an Automation name');
    }

    const generateValues = () => {
      const finalValues = {
        _id: id,
        name,
        status,
        triggers: triggers.map(t => ({
          id: t.id,
          type: t.type,
          config: t.config,
          icon: t.icon,
          label: t.label,
          description: t.description,
          actionId: t.actionId,
          style: jquery(`#trigger-${t.id}`).attr('style')
        })),
        actions: actions.map(a => ({
          id: a.id,
          type: a.type,
          nextActionId: a.nextActionId,
          config: a.config,
          icon: a.icon,
          label: a.label,
          description: a.description,
          style: jquery(`#action-${a.id}`).attr('style')
        }))
      };

      return finalValues;
    };

    save(generateValues());
  };

  handleNoteModal = () => {
    this.setState({ showNoteForm: !this.state.showNoteForm });
  };

  handleTemplateModal = () => {
    this.setState({ showTemplateForm: !this.state.showTemplateForm });
  };

  switchActionbarTab = type => {
    this.setState({ isActionTab: type === 'action' ? true : false });
  };

  onToggle = e => {
    const isActive = e.target.checked;

    this.setState({ isActive });

    const { save, automation } = this.props;

    if (automation) {
      save({ _id: automation._id, status: isActive ? 'active' : 'draft' });
    }
  };

  onAddActionConfig = config => {
    const { activeAction } = this.state;

    activeAction.config = config;
    this.setState({ activeAction });
  };

  onClickTrigger = (trigger: ITrigger) => {
    const config = trigger && trigger.config;
    const selectedContentId = config && config.contentId;

    this.setState({
      showTrigger: true,
      showDrawer: true,
      showAction: false,
      currentTab: 'triggers',
      selectedContentId,
      activeTrigger: trigger ? trigger : ({} as ITrigger)
    });
  };

  onClickAction = (action: IAction) => {
    this.setState({
      showAction: true,
      showDrawer: true,
      showTrigger: false,
      currentTab: 'actions',
      activeAction: action ? action : ({} as IAction)
    });
  };

  onConnection = info => {
    const { triggers, actions } = this.state;

    connection(triggers, actions, info, info.targetId.replace('action-', ''));

    this.setState({ triggers, actions });
  };

  onDettachConnection = info => {
    const { triggers, actions } = this.state;

    connection(triggers, actions, info, undefined);

    this.setState({ triggers, actions });
  };

  handleClickOutside = event => {
    if (this.wrapperRef && !this.wrapperRef.contains(event.target)) {
      this.setState({ showDrawer: false });
    }
  };

  toggleDrawer = (type: string) => {
    this.setState({ showDrawer: !this.state.showDrawer, currentTab: type });
  };

  addTrigger = (data: ITrigger, contentId?: string, triggerId?: string) => {
    const { triggers, activeTrigger } = this.state;

    let trigger: any = { id: String(triggers.length), ...data };
    const triggerIndex = triggers.findIndex(t => t.id === triggerId);

    if (triggerId && activeTrigger.id === triggerId) {
      trigger = activeTrigger;
    }

    if (contentId) {
      trigger.config = {
        contentId
      };
    }

    if (triggerIndex !== -1) {
      triggers[triggerIndex] = trigger;
    } else {
      triggers.push(trigger);
    }

    this.setState({ triggers, activeTrigger: trigger });

    if (!triggerId) {
      this.renderControl('trigger', trigger, this.onClickTrigger);
    }
  };

  addAction = (
    data: IAction,
    contentId?: string,
    actionId?: string,
    config?: any
  ) => {
    const { actions } = this.state;

    let action: any = { id: String(actions.length), ...data };

    let actionIndex = -1;

    if (actionId) {
      actionIndex = actions.findIndex(a => a.id === actionId);

      if (actionIndex !== -1) {
        action = actions[actionIndex];
      }
    }

    if (contentId) {
      action.config = {
        contentId
      };
    }

    if (config) {
      action.config = config;
    }

    if (actionIndex !== -1) {
      actions[actionIndex] = action;
    } else {
      actions.push(action);
    }

    this.setState({ actions, activeAction: action });

    if (!actionId) {
      this.renderControl('action', action, this.onClickAction);
    }
  };

  onNameChange = (e: React.FormEvent<HTMLElement>) => {
    const value = (e.currentTarget as HTMLButtonElement).value;
    this.setState({ name: value });
  };

  renderControl = (key: string, item: ITrigger | IAction, onClick: any) => {
    const idElm = `${key}-${item.id}`;

    jquery('#canvas').append(`
      <div class="${key} control" id="${idElm}" style="${item.style}">
        <div class="trigger-header">
          <div class='custom-menu'>
            <div>
              <i class="icon-notes add-note" title="Notes"></i>
              <i class="icon-trash-alt delete-control" id="${key}-${item.id}" title="Delete control"></i>
            </div>
          </div>
          <div>
            <i class="icon-${item.icon}"></i>
            ${item.label}
          </div>
        </div>
        <p>${item.description}</p>
      </div>
    `);

    jquery('#canvas').on('dblclick', `#${idElm}`, event => {
      event.preventDefault();

      onClick(item);
    });

    if (key === 'trigger') {
      instance.addEndpoint(idElm, sourceEndpoint, {
        anchor: [1, 0.5]
      });

      instance.draggable(instance.getSelector(`#${idElm}`));
    }

    if (key === 'action') {
      if (item.type === 'if') {
        instance.addEndpoint(idElm, targetEndpoint, {
          anchor: ['Left']
        });

        instance.addEndpoint(idElm, yesEndPoint);
        instance.addEndpoint(idElm, noEndPoint);
      } else {
        instance.addEndpoint(idElm, targetEndpoint, {
          anchor: ['Left']
        });

        instance.addEndpoint(idElm, sourceEndpoint, {
          anchor: ['Right']
        });
      }

      instance.draggable(instance.getSelector(`#${idElm}`));
    }
  };

  rendeRightActionBar() {
    const { isActive } = this.state;
    const { id } = this.props;

    return (
      <BarItems>
        <ToggleWrapper>
          <span className={isActive ? 'active' : ''}>Inactive</span>
          <Toggle defaultChecked={isActive} onChange={this.onToggle} />
          <span className={!isActive ? 'active' : ''}>Active</span>
        </ToggleWrapper>
        <Button
          btnStyle="primary"
          size="small"
          icon="plus-circle"
          onClick={this.toggleDrawer.bind(this, 'triggers')}
        >
          Add a Trigger
        </Button>
        <Button
          btnStyle="primary"
          size="small"
          icon="plus-circle"
          onClick={this.toggleDrawer.bind(this, 'actions')}
        >
          Add an Action
        </Button>
        {id && (
          <Button
            btnStyle="primary"
            size="small"
            icon={'check-circle'}
            onClick={this.handleTemplateModal}
          >
            Save as a template
          </Button>
        )}
        <Button
          btnStyle="success"
          size="small"
          icon={'check-circle'}
          onClick={this.handleSubmit}
        >
          Publish to site
        </Button>
      </BarItems>
    );
  }

  renderLeftActionBar() {
    const { isActionTab, name } = this.state;

    return (
      <CenterFlexRow>
        <Link to={`/automations`}>
          <BackButton>
            <Icon icon="angle-left" size={20} />
          </BackButton>
        </Link>
        <Title>
          <FormControl
            name="name"
            value={name}
            onChange={this.onNameChange}
            required={true}
            autoFocus={true}
          />
          <Icon icon="edit-alt" size={16} />
        </Title>
        <CenterBar>
          <Tabs full={true}>
            <TabTitle
              className={isActionTab ? 'active' : ''}
              onClick={this.switchActionbarTab.bind(this, 'action')}
            >
              {__('Actions')}
            </TabTitle>
            <TabTitle
              className={isActionTab ? '' : 'active'}
              onClick={this.switchActionbarTab.bind(this, 'settings')}
            >
              {__('Settings')}
            </TabTitle>
          </Tabs>
        </CenterBar>
      </CenterFlexRow>
    );
  }

  renderTabContent() {
    const {
      currentTab,
      showTrigger,
      showAction,
      activeTrigger,
      activeAction,
      selectedContentId
    } = this.state;

    const onBack = () => this.setState({ showTrigger: false });
    const onBackAction = () => this.setState({ showAction: false });

    if (currentTab === 'triggers') {
      if (showTrigger && activeTrigger) {
        return (
          <>
            <BackIcon onClick={onBack}>
              <Icon icon="angle-left" size={20} /> Back to triggers
            </BackIcon>
            <ScrolledContent>
              <TriggerDetailForm
                activeTrigger={activeTrigger}
                addConfig={this.addTrigger}
                closeModal={onBack}
                contentId={selectedContentId}
              />
            </ScrolledContent>
          </>
        );
      }

      return <TriggerForm onClickTrigger={this.onClickTrigger} />;
    }

    if (currentTab === 'actions') {
      if (showAction && activeAction) {
        return (
          <>
            <BackIcon onClick={onBackAction}>
              <Icon icon="angle-left" size={20} /> Back to actions
            </BackIcon>
            <ActionDetailForm
              activeAction={activeAction}
              addAction={this.addAction}
              closeModal={onBackAction}
            />
          </>
        );
      }

      return <ActionsForm onClickAction={this.onClickAction} />;
    }

    return null;
  }

  renderContent() {
    const { automation } = this.props;

    if (!this.state.isActionTab) {
      return <SettingsContainer />;
    }

    if (!automation) {
      return (
        <Container>
          <div
            className="trigger scratch"
            onClick={this.toggleDrawer.bind(this, 'triggers')}
          >
            <Icon icon="file-plus" size={25} />
            <p>How do you want to trigger this automation?</p>
          </div>
        </Container>
      );
    }

    return (
      <Container>
        <div id="canvas" />
      </Container>
    );
  }

  renderNoteModal() {
    const { showNoteForm } = this.state;

    if (!showNoteForm) {
      return null;
    }

    return (
      <Modal
        enforceFocus={false}
        show={showNoteForm}
        onHide={this.handleNoteModal}
        animation={false}
      >
        <Modal.Body>
          <Form
            renderContent={formProps => (
              <NoteFormContainer
                formProps={formProps}
                notes={this.props.automationNotes}
                closeModal={this.handleNoteModal}
              />
            )}
          />
        </Modal.Body>
      </Modal>
    );
  }

  renderTemplateModal() {
    const { showTemplateForm } = this.state;
    const { automation } = this.props;

    if (!showTemplateForm || !automation) {
      return null;
    }

    return (
      <Modal
        enforceFocus={false}
        show={showTemplateForm}
        onHide={this.handleTemplateModal}
        animation={false}
      >
        <Modal.Body>
          <Form
            renderContent={formProps => (
              <TemplateForm
                formProps={formProps}
                closeModal={this.handleTemplateModal}
                automation={automation}
              />
            )}
          />
        </Modal.Body>
      </Modal>
    );
  }

  render() {
    const { automation } = this.props;

    return (
      <>
        <HeightedWrapper>
          <AutomationFormContainer>
            <Wrapper.Header
              title={`${'Automations' || ''}`}
              breadcrumb={[
                { title: __('Automations'), link: '/automations' },
                { title: `${(automation && automation.name) || ''}` }
              ]}
            />
            <PageContent
              actionBar={
                <Wrapper.ActionBar
                  left={this.renderLeftActionBar()}
                  right={this.rendeRightActionBar()}
                />
              }
              transparent={false}
            >
              {this.renderContent()}
            </PageContent>
          </AutomationFormContainer>

          <div ref={this.setWrapperRef}>
            <RTG.CSSTransition
              in={this.state.showDrawer}
              timeout={300}
              classNames="slide-in-right"
              unmountOnExit={true}
            >
              <RightDrawerContainer>
                {this.renderTabContent()}
              </RightDrawerContainer>
            </RTG.CSSTransition>
          </div>

          {this.renderNoteModal()}
          {this.renderTemplateModal()}
        </HeightedWrapper>
      </>
    );
  }
}

export default AutomationForm;
