<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, nextTick, toRaw } from "vue";
import { storeToRefs } from "pinia";
// import { useWatchVideoInfo } from '@/stores/WatchVideo';
// import { usePostEdit } from '@/stores/PostEditComponent';

// import { useChapterStore } from '@/stores/ChapterComponent';
// import { useConfigStore } from '@/stores/config';
// import { useAlertsStore } from '@/stores/Alerts';

// import XMarkIcon from '@/components/Parts/CommonParts/Icon/XMarkIcon.vue';
import { TransitionRoot, Dialog, DialogPanel } from "@headlessui/vue";
// prosemirror
import { EditorState } from "prosemirror-state";
import { EditorView } from "prosemirror-view";
import { Schema } from "prosemirror-model";
import { keymap } from "prosemirror-keymap";
import { baseKeymap } from "prosemirror-commands";

// import { useVideoJS } from '@/stores/VideoJS';
import { useCommentStore } from "../Store/comment";
// import { useWatchVideoPortraitStore } from '@/stores/WatchVideoPortrait';
// import { useDefineNumbers } from '@/stores/defineNumbers';
// import { is } from '@babel/types';
// const { commentFocusIn } = storeToRefs(useWatchVideoPortraitStore());

// const alerts = useAlertsStore();
// const message = alerts.Messages.guest_user_unauthorized;

// const Comment = useCommentStore();
// const numbers = useDefineNumbers();

// const {
//     isOpenMention,
//     c,
//     mentionMembers,
//     searchMentionText,
//     displaySearchMentionUsers,
//     selectedMemberIndex,
//     // displayCount,
//     // displayUsersMaxCount,
//     // isCommenting,
//     mentionStartFlag,
// } = storeToRefs(Comment);

const {
  isOpenMention,
  mentionMembers,
  searchMentionText,
  selectedMemberIndex,
  mentionStartFlag,
  displayData,
} = storeToRefs(useCommentStore());
// const { isRemoveSticky, focusedInput } = storeToRefs(useVideoJS());
// const { CommentPostingAuthorityCheck } = storeToRefs(useConfigStore());

const commentInput = ref<HTMLElement>();

const isTouchDevice = ref<boolean>(false);
const c = ref<string>();
const schema = new Schema({
  nodes: {
    doc: { content: "paragraph+" },
    paragraph: {
      content: "inline*",
      toDOM: () => ["p", 0],
    },
    text: { group: "inline" },
    mention: {
      group: "inline",
      inline: true,
      attrs: { id: { default: 0 }, name: { default: "?" } },
      toDOM: (node) => [
        "span",
        {
          class:
            "mention inline-block text-[#0CB8B9] cursor-pointer text-center no-underline select-auto",
          "data-id": node.attrs.id,
        },
        "@" + node.attrs.name + "さん",
      ],
    },
  },
});
const state = EditorState.create({
  schema,
  plugins: [keymap(baseKeymap)],
});
let view: EditorView;
// const editorview = ref<EditorView>();

const insertMention = (id: number, name: string) => {
  setIsOpen(false);
  setTimeout(() => {
    commentFocusOn();

    // test start
    setTimeout(() => {
      const selection1 = view?.state.selection;
      const mentionNode1 = schema.nodes.mention.create({ id, name });
      const delTr1 = view?.state.tr;
      console.log(
        "inserting at: ",
        "from",
        view.state.selection.from,
        "to",
        view.state.selection.to
      );
      delTr1.replaceWith(selection1.from, selection1.to, mentionNode1);
      view.dispatch(delTr1);
      return;
    }, 100);
  }, 100);
  // test end

  return;
  console.log("Id and name", id, name);
  console.log("View 1st", view);
  // 未入力時動作修正
  if (c.value == "") clearCommentInput();

  //入力された@削除
  const delTr = view?.state.tr;
  console.log("deltr", delTr);
  //現在のカーソルの位置を取得
  const pos = view?.state.selection.anchor;
  //削除
  delTr.delete(pos - 1, pos);
  //削除した位置に空白を入れる androidの場合、空白不要
  if (!(window as any).directJsApi) {
    console.log("android以外");
    delTr.insertText(" ");
  } else {
    console.log("android");
  }
  //削除分、更新
  console.log("View 2nd", view);
  view.dispatch(delTr);

  console.log("schema:", schema);
  //メンションデータ挿入
  const tr = view?.state.tr;
  const selection = view?.state.selection;
  const mentionNode = schema.nodes.mention.create({ id, name });
  if (tr && selection) {
    tr.insertText("\u00A0");
    tr.replaceWith(selection.from, selection.to, mentionNode);

    //更新
    const newState = view.state.apply(tr);
    view.updateState(newState);
  }
};
const isRemoveSticky = ref<boolean>(false);
const focusedInput = ref<boolean>(false);

onMounted(() => {
  const ua = navigator.userAgent.toLowerCase();
  if (
    ua.indexOf("iphone") > -1 ||
    (ua.indexOf("android") > -1 && ua.indexOf("mobile") > -1)
  ) {
    // スマートフォン
    isTouchDevice.value = true;
  }
  if (commentInput.value) {
    // editorview.value = new EditorView(commentInput.value, {
    //   state,
    //   handleDOMEvents: {
    //     focus: () => {
    //       // console.log('focus', event);
    //       // ここでフォーカスされた時の処理を記述する
    //       isRemoveSticky.value = true;
    //       focusedInput.value = true;
    //     },
    //     blur: () => {
    //       // console.log('blur', event);
    //       focusedInput.value = false;
    //       // ここでフォーカスが外れた時の処理を記述する
    //     },
    //   },
    // });
    view = new EditorView(commentInput.value, {
      state,
      dispatchTransaction(transaction) {
        console.log(
          "Document size went from",
          transaction.before.content.size,
          "to",
          transaction.doc.content.size
        );
        let newState = view.state.apply(transaction);
        console.log(
          "new state",
          newState.selection.from,
          newState.selection.to
        );
        view.updateState(newState);
      },
      handleDOMEvents: {
        focus: () => {
          // console.log('focus', event);
          // ここでフォーカスされた時の処理を記述する
          isRemoveSticky.value = true;
          focusedInput.value = true;
          console.log(
            "focused: ",
            "from",
            view.state.selection.from,
            "to",
            view.state.selection.to
          );
        },
        blur: () => {
          // console.log('blur', event);
          focusedInput.value = false;
          // ここでフォーカスが外れた時の処理を記述する
          console.log(
            "blurred: ",
            "from",
            view.state.selection.from,
            "to",
            view.state.selection.to
          );
        },
      },
    });
  }

  // メンション削除時動作修正
  const styles = `
    p img.ProseMirror-separator {
    display: none;
    }
    `;
  const styleSheet = document.createElement("style");
  styleSheet.type = "text/css";
  styleSheet.innerText = styles;
  document.head.appendChild(styleSheet);
  useCommentStore().addDisplayUsers();
  //WatchTemplate, PostEditTemplateでそれぞれ呼ぶようにする
  // window.addEventListener('scroll', handleScroll);
});

onUnmounted(() => {
  setIsOpen(false);
});

watch(c, () => {
  if (!c.value) {
    clearCommentInput();
  }
});
//WatchTemplate, PostEditTemplateでそれぞれ呼ぶようにする
// const handleScroll = () => {
//     isCommenting.value = false;
//     if (!focusedInput.value) {
//         isRemoveSticky.value = false;
//     }
// };

// modal 開閉
// const isOpen = ref(false);

const setIsOpen = (open: boolean) => {
  //   if (!editorview.value) return;
  //   const view = editorview.value;
  if (mentionStartFlag.value) return;
  mentionStartFlag.value = true;
  isOpenMention.value = open;
  setTimeout(() => {
    if (isOpenMention.value) {
      console.log("isOpenMention.value", searchMentionText.value);
      nextTick(() => {
        if (mentionInput.value) {
          searchMentionText.value = "";
          mentionInput.value.focus();
        }
      });
    } else {
      if (!c.value) {
        clearCommentInput();
      }
      checkFocus();
      nextTick(() => {
        view.focus();
      });
    }
    mentionStartFlag.value = false;
  }, 100);
};
const mentionInput = ref<HTMLTextAreaElement>();

const commentFocusIn = ref<boolean>(false);

// メンションモーダル表示
const mentionStart = async (event: Event) => {
  await new Promise((resolve) => setTimeout(resolve, 0));
  //Event型をInputEvent型に変換
  const inputEvent = event as InputEvent;
  selectedMemberIndex.value = 0;
  console.log("mentionStart", inputEvent);
  // Comment.getMentionMembers(c.value)
  const keyData = inputEvent.data;
  if (keyData == "@" || keyData == "＠") {
    if (keyData == "＠") {
      commentFocusIn.value = false;
      commentInput.value?.blur();
      // ckhRef.value?.focus();
      document.getElementById("btnSendComment")?.focus();
      nextTick(() => {
        view.focus();
      });
      // setTimeout(() => {
      //     // commentFocusIn.value = true;
      //     view.focus();
      // }, 1000);
    }
    // 未入力時動作修正
    if (c.value == "") {
      const tr = view.state.tr;
      tr.insertText("\u00A0");
      const newState = view.state.apply(tr);
      view.updateState(newState);
    }
    console.log("Comment cannot exceed max mention");
    if (mentionMembers.value.length >= 10) {
      console.error("Comment cannot exceed max mention");
      event.preventDefault();
      return;
    }
    searchMentionText.value = "";
    // searchMention();
    setTimeout(() => setIsOpen(true), 100);
  }
};
// const searchMention = async () => {
//     selectedMemberIndex = null;
//     console.log(searchMentionText.value);
//     const searchText = searchMentionText.value;
//     const data = await Comment.getMentionMembers(searchText);
//     console.log(data);
//     if (data) {
//         searchMembers.value = data.map((user, index) => {
//             let isSelected = false;
//             // if (index == 0) {
//             //     isSelected = true;
//             // }
//             return {
//                 id: user.domainUserDirectId,
//                 name: user.name,
//                 isSelected: isSelected,
//             };
//         });
//     }
// };
const clearCommentInput = () => {
  //   if (!editorview.value) return;
  //   const view = editorview.value;
  const tr = view.state.tr.delete(0, view.state.doc.content.size);
  const newState = view.state.apply(tr);
  view.updateState(newState);
};
const addMention = (
  event: KeyboardEvent | MouseEvent | TouchEvent | undefined,
  id?: number,
  name?: string
) => {
  console.log("*** addmention start. this is after item selection.");
  if (event?.cancelable) {
    event?.preventDefault();
  } /* else {
    return;
  }*/
  if (mentionStartFlag.value) return;
  if (id && name) {
    insertMention(id, name);
  } else if (displayData.value.length != 0) {
    const selectMention = displayData.value[selectedMemberIndex.value];
    if (selectMention) insertMention(selectMention.id, selectMention.name);
  } else {
    if (
      selectedMemberIndex.value == null ||
      selectedMemberIndex.value < 0 ||
      selectedMemberIndex.value >= displayData.value.length
    ) {
      selectedMemberIndex.value = 0;
      return;
    }
  }
  checkFocus();
  console.log("This is after insert mention");
  getContent();
  console.log("This is after get content");
  setIsOpen(false);
  console.log("this is after set is open");
  nextTick(async () => {
    // setTimeout(() => {
    //     commentInput.value?.click();
    // }, 100);
    // await new Promise((resolver) => setTimeout(() => {
    //     document.getElementsByClassName('ProseMirror')[0].dispatchEvent(new Event('click'));
    // }, 200))

    setTimeout(() => {
      commentFocusOn();
    }, 200);

    setTimeout(() => {
      document
        .getElementsByClassName("ProseMirror")[0]
        .dispatchEvent(new Event("click"));
    }, 250);
  });
};

const scrollSelectedIntoView = () => {
  const selected = document.querySelector(".MentionSelected");
  if (container.value && selected) {
    const containerTop = container.value.getBoundingClientRect().top;
    const selectedTop = selected.getBoundingClientRect().top;
    container.value.scrollTop += selectedTop - containerTop;
  }
};

const focusCommentField = () => {
  //   if (!editorview.value) return;
  //   const view = editorview.value;
  view.dom.addEventListener("input", function (event: Event) {
    console.log("Input event triggered!", event);
  });
  view.dom.addEventListener("touchstart", function (event: Event) {
    console.log("touch event triggered!", event);
  });
  console.log("This is a touch device", isTouchDevice);
  if (!isTouchDevice.value) {
    setTimeout(() => {
      const event = new Event("input", { bubbles: true });
      view.dom.dispatchEvent(event);
      view.dom.focus();
      console.log("Inside timer");
      checkFocus();
    }, 100); // Adjust the delay as needed
    console.log("outside timer");

    checkFocus();
  } else {
    console.log("This is for touch device");
    const touch = new Touch({
      identifier: Date.now(),
      target: view.dom,
      clientX: 0, // Set the desired X coordinate
      clientY: 0, // Set the desired Y coordinate
      radiusX: 2.5,
      radiusY: 2.5,
      rotationAngle: 10,
      force: 0.5,
    });

    const touchEvent = new TouchEvent("touchstart", {
      bubbles: true,
      touches: [touch],
      targetTouches: [touch],
      changedTouches: [touch],
    });
    console.log("This is a touchEvent", touchEvent);
    // Dispatch the touch event
    view.dom.dispatchEvent(touchEvent);
    setTimeout(() => {
      view.dom.focus();
    }, 100);
    checkFocus();
  }
};

const checkFocus = () => {
  // Get the currently focused element
  const focusedElement = document.activeElement;

  // Check if there is a focused element
  if (focusedElement) {
    console.log("Currently focused element:", focusedElement);
  } else {
    console.log("No element is currently focused.");
  }
};

const selectNext = () => {
  if (selectedMemberIndex.value < displayData.value.length - 1) {
    selectedMemberIndex.value++;
  } else {
    selectedMemberIndex.value = 0;
  }
  setTimeout(scrollSelectedIntoView, 0);
};

const selectPrev = () => {
  if (selectedMemberIndex.value > 0) {
    selectedMemberIndex.value--;
  } else {
    selectedMemberIndex.value = displayData.value.length - 1;
  }
  setTimeout(scrollSelectedIntoView, 0);
};

const isCompositionStart = ref(false);
const handleCompositionEvent = (event: CompositionEvent) => {
  if (mentionStartFlag.value) return;
  if (event.type === "compositionstart") {
    isCompositionStart.value = true;
    // console.log('compositionstart', isCompositionStart.value);
    return;
  }
  isCompositionStart.value = false;
  // console.log('compositionend', isCompositionStart.value);
};

const onKeydownMentionInput = (event: KeyboardEvent) => {
  if (isCompositionStart.value === true) {
    return;
  } else {
    addMention(event);
  }
};

const onDialogClick = () => {
  // setIsOpen(false);
  // commentFocusOn();
  // setTimeout(() => {
  //     setTimeout(() => insertMention(1, myInput.value??''), 0);
  // }, 1000);
};

const onMentionNameClick = (
  event: KeyboardEvent | MouseEvent | TouchEvent,
  id: number,
  name: string,
  index: number
) => {
    if (index == selectedMemberIndex.value) {
      console.log("Event", event);
      console.log("id", id);
      console.log("name", name);
      console.log("index", index);
      setTimeout(() => addMention(event, id, name), 0);
    } else {
      event?.preventDefault();
      selectedMemberIndex.value = index;
    }
};

const container = ref<HTMLElement | null>(null);

const getContentAfterPaste = () => {
  // コンテンツが貼り付けられた後にgetContentを呼び出す。
  setTimeout(getContent, 0);
};

const CommentPostingAuthorityCheck = ref<boolean>(true);
const getContent = () => {
  // 権限確認
  if (CommentPostingAuthorityCheck.value == false) {
    console.log("Alert message");
    setTimeout(clearCommentInput, 0);
    return;
  }
  /** コメントテキストの取得 */
  if (commentInput.value) {
    const text = commentInput.value.innerHTML;
    const div = document.createElement("div");
    div.innerHTML = text;
    const texts = Array.from(div.querySelectorAll("p")).map((p) => p.innerText);
    const commentText = texts.join("\n");
    c.value = commentText;
  }

  /** メンションリストの取得 */
  const mentions: { id: number; name: string }[] = [];
  //   if (!editorview.value) return;
  //   const view = editorview.value;
  view.state.doc.descendants((node) => {
    if (node.type.name === "mention") {
      const id = node.attrs.id;
      const name = node.attrs.name;
      mentions.push({ id: id, name: name });
    }
  });
  console.log("Mentions", mentions);

  mentionMembers.value = mentions.filter(
    (obj, index, self) => index === self.findIndex((t) => t.id === obj.id)
  );
  console.log("Mention members", mentionMembers.value);
};

const handleScroll = async () => {
  const containers = container.value;
  // console.log('Scroll event triggered');
  if (
    containers &&
    Math.ceil(containers.scrollTop + containers.clientHeight) >=
      containers.scrollHeight - 50
  ) {
    // console.log('Reached the bottom');
    // if (displayCount < displayUsersMaxCount) {
    useCommentStore().addDisplayUsers();
    // }
  }
};

const commentFocusOn = () => {
  if (commentFocusIn.value) return; // 既にフォーカスされている場合は何もしない

  const commentEditor = commentInput.value?.querySelector(
    ".ProseMirror"
  ) as HTMLElement;

  if (commentEditor) {
    // console.log('comment editor found, focusing', commentEditor);
    commentEditor?.focus();
  } else {
    console.log("comment editor not found, not focusing");
  }
};
const myInput = ref<string>();
const openEditor = () => {
  commentFocusOn();
};
const appendText = () => {
  if (myInput.value) {
    // insertMention(1, myInput.value);
    // myInput.value = "";

    setIsOpen(true);
    // return;
    setTimeout(() => {
      // insertMention(1, myInput.value ?? 'noname');
      // document.getElementsByClassName('myitem')[0].dispatchEvent(new Event('click'));
      // setTimeout(() => addMention(undefined, 1, myInput.value??''), 0);
      // setTimeout(() => addMention(undefined, 1, '1' + (myInput.value??'')), 500);
      // setTimeout(() => addMention(undefined, 1, '2' + (myInput.value??'')), 1000);
      // setTimeout(() => addMention(undefined, 1, '3' + (myInput.value??'')), 1500);
      // setTimeout(() => addMention(undefined, 1, '4' + (myInput.value??'')), 2000);

      // setTimeout(() => insertMention(1, myInput.value??''), 0);
      setTimeout(() => {
        setIsOpen(true);
        setTimeout(() => {
          insertMention(1, "1" + (myInput.value ?? ""));
        }, 2000);
      }, 2000);
      setTimeout(() => {
        setIsOpen(true);
        setTimeout(() => {
          insertMention(1, "2" + (myInput.value ?? ""));
        }, 2000);
      }, 4000);
      setTimeout(() => {
        setIsOpen(true);
        setTimeout(() => {
          insertMention(1, "3" + (myInput.value ?? ""));
        }, 2000);
      }, 6000);
      setTimeout(() => {
        setIsOpen(true);
        setTimeout(() => {
          insertMention(1, "4" + (myInput.value ?? ""));
        }, 2000);
      }, 8000);
      setTimeout(() => {
        setIsOpen(true);
        setTimeout(() => {
          insertMention(1, "5" + (myInput.value ?? ""));
        }, 2000);
      }, 10000);
    }, 100);

    // setTimeout(() => {
    //     setIsOpen(false);
    // }, 2000);
  }
};
</script>

<template>
  <!-- 
    @keyup="getContent"
     -->
  <div
    ref="commentInput"
    class="ProseMirror user-selectable"
    @click="commentFocusOn"
    @beforeinput="mentionStart"
    @paste="getContentAfterPaste"
    @input="getContent"
    @focusin="commentFocusIn = true"
    @focusout="(focusedInput = false), (commentFocusIn = false)"
  ></div>
  <div style="background-color: antiquewhite" class="p-4 m-1">
    <div class="flex flex-row">
      <button @click="openEditor" class="p-2 bg-blue-300 max-w-[200px]">
        open editor
      </button>
      <button @click="appendText" class="p-2 bg-blue-300 max-w-[50px]">
        Add
      </button>
    </div>
    <input
      v-model="myInput"
      id="myInput"
      class="myInput w-full bg-blue-100 border-green-100"
    />
  </div>
  <TransitionRoot
    leave="duration-100 ease-in"
    leave-from="opacity-100"
    leave-to="opacity-0"
    :show="isOpenMention"
    as="template"
    enter="duration-100 ease-out"
    enter-to="opacity-100"
    enter-from="opacity-0"
  >
    <Dialog as="form" class="relative z-50" @close="setIsOpen">
      <!-- パネル コンテナーの固定兄弟としてレンダリングされる背景 -->
      <div class="fixed inset-0 bg-black/40" aria-hidden="true">
        <div class="flex min-h-full items-center justify-center p-4">
          <DialogPanel>
            <div class="rounded-lg bg-white py-2.5 px-3 h-48 w-60">
              <div class="flex justify-between items-center mb-2">
                <h4
                  class="ml-0.5 text-sm md:text-xs font-bold"
                  @click="onDialogClick"
                >
                  メンション
                </h4>
                <button
                  class="p-2 -m-2 rounded-full w-fit h-fit"
                  type="button"
                  @click="setIsOpen(false)"
                >
                  <XMarkIcon class="w-3.5 h-3.5" />
                </button>
              </div>
              <section class="flex flex-col h-full">
                <input
                  ref="mentionInput"
                  v-model="searchMentionText"
                  type="text"
                  class="py-[5px] px-3 mb-1.5 rounded-lg bg-[#EFEFEF] text-[#767676] text-sm md:text-xs focus:outline-none"
                  @keydown.enter="onKeydownMentionInput"
                  @keydown.arrow-down.prevent="selectNext"
                  @keydown.prevent.tab.exact="selectNext"
                  @keydown.arrow-up.prevent="selectPrev"
                  @compositionstart="handleCompositionEvent"
                  @compositionend="handleCompositionEvent"
                />
                <ul
                  ref="container"
                  class="overflow-y-scroll max-h-[calc(100%_-_56px)]"
                  @scroll="handleScroll"
                >
                  <li @click="onDialogClick">Click me for testing</li>
                  <li
                    v-for="(user, index) in displayData"
                    :key="index"
                    :class="{
                      MentionSelected: selectedMemberIndex === index,
                    }"
                    class="myitem py-1 px-3 cursor-pointer text-[#767676] text-sm md:text-x flex items-center truncate focus:bg-[#efefef] hover:overflow-scroll none-scrollbar"
                    @click.prevent="
                      !isTouchDevice
                        ? onMentionNameClick($event, user.id, user.name, index)
                        : null
                    "
                    @touchstart="
                      isTouchDevice
                        ? onMentionNameClick($event, user.id, user.name, index)
                        : null
                    "
                  >
                    {{ user.name }}
                  </li>
                  <li @click="onDialogClick">Click me for testing</li>
                </ul>
              </section>
            </div>
          </DialogPanel>
        </div>
      </div>
    </Dialog>
  </TransitionRoot>
</template>
<style scoped>
.ProseMirror {
  background-color: rgb(249 250 251);
  padding-top: 0.375rem;
  padding-bottom: 0.375rem;
  padding-left: 0.625rem;
  padding-right: 0.625rem;
  margin-bottom: 6px;
  border-radius: 0.5rem;
  border-width: 1px;
  border-color: rgb(209 213 219);
  color: rgb(17 24 39);
  text-align: left;
  font-size: 14px;
  line-height: normal;
  white-space: pre-wrap;
  width: 100%;
  min-height: 56px;
  max-height: 6rem;
  overflow-y: scroll;
}

.ProseMirror > div {
  max-height: 160px;
  overflow-y: scroll;
  display: inline-block;
}
.MentionSelected {
  background-color: #efefef;
}
</style>
