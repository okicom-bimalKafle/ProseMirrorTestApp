<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, nextTick } from "vue";
import { storeToRefs } from "pinia";

import { TransitionRoot, Dialog, DialogPanel } from "@headlessui/vue";
import { useCommentStore } from "../Store/comment";

// prosemirror
import { EditorState } from "prosemirror-state";
import { EditorView } from "prosemirror-view";
import { Schema } from "prosemirror-model";
import { keymap } from "prosemirror-keymap";
import { baseKeymap } from "prosemirror-commands";

const {
  isOpenMention,
  mentionMembers,
  searchMentionText,
  selectedMemberIndex,
  mentionStartFlag,
  displayData,
} = storeToRefs(useCommentStore());

const commentInput = ref<HTMLElement>();
const mentionInput = ref<HTMLTextAreaElement>();
let view: EditorView;

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
            "mention inline-block text-[#0CB8B9] cursor-pointer text-center no-underline",
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

onMounted(() => {
  if (commentInput.value) {
    view = new EditorView(commentInput.value, {
      state,
      handleDOMEvents: {
        focus: () => {},
        blur: () => {},
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
});

const mentionStart = async (event: Event) => {
  await new Promise((resolve) => setTimeout(resolve, 0));
  //Event型をInputEvent型に変換
  const inputEvent = event as InputEvent;

  console.log("mentionStart", inputEvent);
  // Comment.getMentionMembers(c.value)
  const keyData = inputEvent.data;
  if (keyData == "@") {
    setTimeout(() => setIsOpen(true), 100);
  }
};

const setIsOpen = (open: boolean) => {
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
      nextTick(() => {
        if (commentInput.value) {
          commentInput.value.focus();
        }
      });
    }
    mentionStartFlag.value = false;
    view.focus();
  }, 100);
};

const onMentionNameClick = (
  event: MouseEvent | TouchEvent,
  id: number,
  name: string,
  index: number
) => {
  if (index == selectedMemberIndex.value) {
    event.preventDefault();
    setTimeout(() => addMention(event, id, name), 0);
  } else {
    event.preventDefault();
    selectedMemberIndex.value = index;
  }
};

const addMention = (
  event: KeyboardEvent | MouseEvent | TouchEvent,
  id?: number,
  name?: string
) => {
  if (event.cancelable) {
    event.preventDefault();
  } else {
    return;
  }
  if (mentionStartFlag.value) return;
  if (id && name) {
    console.log("id and name", id, name);
    insertMention(id, name);
  } else if (displayData.value.length != 0) {
    const selectMention = displayData.value[selectedMemberIndex.value];
    if (selectMention) insertMention(selectMention.id, selectMention.name);
    console.log("id and name selected", selectMention);
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
  setIsOpen(false);
};

const insertMention = (id: number, name: string) => {
  const delTr = view?.state.tr;

  const pos = view?.state.selection.anchor;

  delTr.delete(pos - 1, pos);

  view.dispatch(delTr);

  const tr = view?.state.tr;
  const selection = view?.state.selection;
  const mentionNode = schema.nodes.mention.create({ id, name });
  if (tr && selection) {
    tr.insertText("\u00A0");
    tr.replaceWith(selection.from, selection.to, mentionNode);
    const newState = view.state.apply(tr);
    view.updateState(newState);
  }
};
</script>

<template>
  <div ref="commentInput" class="ProseMirror" @beforeinput="mentionStart"></div>
  <div>
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
                  <h4 class="ml-0.5 text-sm md:text-xs font-bold">
                    メンション
                  </h4>
                </div>
                <section class="flex flex-col h-full">
                  <ul
                    ref="container"
                    class="overflow-y-scroll max-h-[calc(100%_-_56px)]"
                    @scroll=""
                  >
                    <li
                      v-for="(user, index) in displayData"
                      :key="index"
                      :class="{
                        MentionSelected: selectedMemberIndex === index,
                      }"
                      class="py-1 px-3 cursor-pointer text-[#767676] text-sm md:text-x flex items-center truncate focus:bg-[#efefef] hover:overflow-scroll none-scrollbar"
                      @click.prevent="
                        onMentionNameClick($event, user.id, user.name, index)
                      "
                    >
                      {{ user.name }}
                    </li>
                  </ul>
                </section>
              </div>
            </DialogPanel>
          </div>
        </div>
      </Dialog>
    </TransitionRoot>
  </div>
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
}
.MentionSelected {
  background-color: #efefef;
}
</style>
