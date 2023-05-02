import {AudioFileAttachmentType} from './fileAttachments/fileAttachmentTypes/audioFileAttachmentType';
import {FileAttachmentsType} from './fileAttachments/fileAttachmentTypes/fileAttachmentsType';
import {FileServiceIO, ServiceFileTypes, ServiceIO} from '../../../services/serviceIO';
import {FILE_TYPE_BUTTON_ICONS} from '../../../utils/fileTypes/fileTypeButtonIcons';
import {UploadFileButton} from './buttons/uploadFile/uploadFileButton';
import {MicrophoneButton} from './buttons/microphone/microphoneButton';
import {DragAndDrop} from './fileAttachments/dragAndDrop/dragAndDrop';
import {FileAttachments} from './fileAttachments/fileAttachments';
import {ElementUtils} from '../../../utils/element/elementUtils';
import {SideContainers} from './sideContainers/sideContainers';
import {SpeechToText} from './buttons/microphone/speechToText';
import {RecordAudio} from './buttons/microphone/recordAudio';
import {KeyboardInput} from './keyboardInput/keyboardInput';
import {SubmitButton} from './buttons/submit/submitButton';
import {CameraButton} from './buttons/camera/cameraButton';
import {ButtonPosition} from './buttons/buttonPosition';
import {ButtonStyling} from './buttons/buttonStyling';
import {FILE_TYPES} from '../../../types/fileTypes';
import {CustomStyle} from '../../../types/styles';
import {AiAssistant} from '../../../aiAssistant';
import {Messages} from '../messages/messages';

export class Input {
  readonly elementRef: HTMLElement;

  // prettier-ignore
  constructor(aiAssistant: AiAssistant, messages: Messages, serviceIO: ServiceIO, containerElement: HTMLElement) {
    this.elementRef = Input.createPanelElement(aiAssistant.inputStyles?.panel);
    const keyboardInput = new KeyboardInput(aiAssistant.inputStyles, aiAssistant.inputCharacterLimit);
    const {fileAttachments, uploadFileButtons, cameraButton, microphoneButton: recordAudioButton, dropupButton} =
      this.createFileUploadComponents(aiAssistant, serviceIO, containerElement);
    const microphoneButton = recordAudioButton || (aiAssistant.speechInput && new SpeechToText(
      aiAssistant.speechInput, keyboardInput.inputElementRef, messages.addNewErrorMessage.bind(messages)));
    const submitButton = new SubmitButton(aiAssistant, keyboardInput.inputElementRef, messages, serviceIO,fileAttachments);
    keyboardInput.submit = submitButton.submitFromInput.bind(submitButton);
    aiAssistant.submitUserMessage = submitButton.submit.bind(submitButton);
    Input.addElements(this.elementRef, keyboardInput.elementRef,
      [submitButton, microphoneButton, cameraButton, dropupButton, ...uploadFileButtons]);
  }

  private static createPanelElement(customStyle?: CustomStyle) {
    const panelElement = document.createElement('div');
    panelElement.id = 'input';
    Object.assign(panelElement.style, customStyle);
    return panelElement;
  }

  private createFileUploadComponents(aiAssistant: AiAssistant, serviceIO: ServiceIO, containerElement: HTMLElement) {
    const fileAttachments = new FileAttachments(this.elementRef, aiAssistant.attachmentContainerStyle);
    if (aiAssistant.dragAndDrop) DragAndDrop.create(containerElement, fileAttachments, aiAssistant.dragAndDrop);
    const uploadFileButtons: UploadFileButton[] = [];
    const fileAttachmentTypes: {[key in FILE_TYPES]?: FileAttachmentsType} = {};
    Input.addButtons(serviceIO.fileTypes || {}, fileAttachments, containerElement, uploadFileButtons, fileAttachmentTypes);
    let cameraButton: CameraButton | undefined;
    if (serviceIO.camera?.files) {
      const fileAttachmentsType = fileAttachmentTypes.images || fileAttachments.addType(serviceIO.camera.files, 'images');
      cameraButton = new CameraButton(containerElement, fileAttachmentsType, serviceIO.camera);
    }
    let microphoneButton: MicrophoneButton | undefined;
    if (serviceIO.recordAudio?.files) {
      const audioType = fileAttachmentTypes.audio || fileAttachments.addType(serviceIO.recordAudio.files, 'audio');
      microphoneButton = new RecordAudio(audioType as AudioFileAttachmentType, serviceIO.recordAudio);
    }
    return {fileAttachments, uploadFileButtons, cameraButton, microphoneButton};
  }

  // prettier-ignore
  private static addButtons(fileTypes: ServiceFileTypes, fileAttachments: FileAttachments, containerElement: HTMLElement,
      uploadFileButtons: UploadFileButton[], fileAttachmentTypes: {[key in FILE_TYPES]?: FileAttachmentsType}) {
    Object.keys(fileTypes).forEach((key) => {
      const fileType = key as keyof ServiceFileTypes;
      const fileService = fileTypes[fileType] as FileServiceIO;
      if (fileService.files) {
        const fileAttachmentsType = fileAttachments.addType(fileService.files, fileType);
        const {id, svgString} = FILE_TYPE_BUTTON_ICONS[fileType];
        const button = new UploadFileButton(containerElement, fileAttachmentsType, fileService, id, svgString);
        uploadFileButtons.push(button);
        fileAttachmentTypes[fileType] = fileAttachmentsType;
      }
    });
  }

  private static addElements(panel: HTMLElement, keyboardInputEl: HTMLElement, buttons: (ButtonStyling | undefined)[]) {
    ElementUtils.addElements(panel, keyboardInputEl);
    const sideContainers = SideContainers.create();
    buttons.forEach((button) => {
      if (button) ButtonPosition.add(panel, sideContainers, button);
    });
    SideContainers.add(panel, sideContainers);
  }
}
