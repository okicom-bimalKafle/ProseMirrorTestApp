import { ref, computed } from "vue";
import { defineStore, storeToRefs } from "pinia";

export const useCommentStore = defineStore("useCommentStore", () => {
  const isGetPostCommentListProcessing = ref<boolean>(false);

  /** メンション */
  const isOpenMention = ref<boolean>(false);
  const mentionMembers = ref<{ id: number; name: string }[]>([]);

  const allUsers = ref<
    {
      id: number;
      name: string;
    }[]
  >([
    { id: 1, name: "John Doe" },
    { id: 2, name: "Jane Smith" },
    { id: 3, name: "Bob Johnson" },
    { id: 4, name: "Alice Williams" },
    { id: 5, name: "Charlie Brown" },
    { id: 6, name: "Emma Davis" },
    { id: 7, name: "Sam Wilson" },
    { id: 8, name: "Olivia White" },
    { id: 9, name: "Ryan Miller" },
    { id: 10, name: "Grace Harris" },
    { id: 11, name: "Michael Lee" },
    { id: 12, name: "Sophia Turner" },
    { id: 13, name: "Ethan Wright" },
    { id: 14, name: "Ava Brown" },
    { id: 15, name: "Matthew Taylor" },
    { id: 16, name: "Emily Clark" },
    { id: 17, name: "Daniel Lewis" },
    { id: 18, name: "Mia Hall" },
    { id: 19, name: "David King" },
    { id: 20, name: "Lily Martinez" },
  ]);
  const searchMentionText = ref<string>("");
  const selectedMemberIndex = ref<number>(0);
  const defaltCount = 8;
  const displayCount = ref<number>(defaltCount);
  const displayUsersMaxCount = computed(() => {
    return displayData.value.length;
  });
  const addDisplayUsers = () => {
    displayCount.value += defaltCount;
  };
  const mentionStartFlag = ref<boolean>(false);

  const displayData = computed(() => {
    selectedMemberIndex.value = 0;
    displayCount.value = defaltCount;
    let filteredUsers = allUsers.value;
    if (mentionMembers.value.length > 0) {
      mentionMembers.value.forEach((element) => {
        filteredUsers = filteredUsers.filter((a) => a.id != element.id);
      });
    }
    return filteredUsers;
  });

  const isCommenting = ref<boolean>(false);

  return {
    isOpenMention,
    mentionMembers,
    displayCount,
    displayUsersMaxCount,
    addDisplayUsers,
    searchMentionText,
    selectedMemberIndex,
    isCommenting,
    isGetPostCommentListProcessing,
    mentionStartFlag,
    displayData,
  };
});
