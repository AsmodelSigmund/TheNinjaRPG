import { useState } from "react";
import { useRouter } from "next/router";
import ItemWithEffects from "../../layout/ItemWithEffects";
import ContentBox from "../../layout/ContentBox";
import NavTabs from "../../layout/NavTabs";
import Loader from "../../layout/Loader";
import Button from "../../layout/Button";
import { DocumentPlusIcon } from "@heroicons/react/24/outline";
import { useInfinitePagination } from "../../libs/pagination";
import { api } from "../../utils/api";
import { show_toast } from "../../libs/toast";
import { canChangeContent } from "../../utils/permissions";
import { useUserData } from "../../utils/UserContext";
import type { LetterRanks } from "../../../drizzle/constants";
import type { NextPage } from "next";

const ManualJutsus: NextPage = () => {
  // Settings
  const { data: userData } = useUserData();
  const [rarity, setRarity] = useState<typeof LetterRanks[number]>("D");
  const [lastElement, setLastElement] = useState<HTMLDivElement | null>(null);

  // Router for forwarding
  const router = useRouter();

  // Data
  const {
    data: jutsus,
    isFetching,
    refetch,
    fetchNextPage,
    hasNextPage,
  } = api.jutsu.getAll.useInfiniteQuery(
    { rarity: rarity, limit: 20 },
    {
      getNextPageParam: (lastPage) => lastPage.nextCursor,
      keepPreviousData: true,
      staleTime: Infinity,
    }
  );
  const alljutsus = jutsus?.pages.map((page) => page.data).flat();
  useInfinitePagination({ fetchNextPage, hasNextPage, lastElement });

  // Mutations
  const { mutate: create, isLoading: load1 } = api.jutsu.create.useMutation({
    onSuccess: async (data) => {
      await refetch();
      await router.push(`/cpanel/jutsu/${data.message}`);
      show_toast("Created Bloodline", "Placeholder Bloodline Created", "success");
    },
    onError: (error) => {
      show_toast("Error creating", error.message, "error");
    },
  });

  const { mutate: remove, isLoading: load2 } = api.jutsu.delete.useMutation({
    onSuccess: async () => {
      await refetch();
      show_toast("Deleted Jutsu", "Jutsu Deleted", "success");
    },
    onError: (error) => {
      show_toast("Error deleting", error.message, "error");
    },
  });

  // Derived
  const totalLoading = isFetching || load1 || load2;

  return (
    <>
      <ContentBox title="Jutsus" subtitle="What are they?" back_href="/manual">
        <p>
          In the world of ninja battles, jutsu refers to the mystical skills and
          techniques that a ninja can use. These techniques require the ninja to harness
          their inner chakra energy, which is released through a series of hand
          movements known as hand seals. With countless combinations of hand seals and
          chakra energies, there are endless possibilities for the types of jutsu that
          can be created. Whether it is a technique for offence or defence, a skilled
          ninja must master the art of jutsu to become a true warrior.
        </p>
        <p className="pt-4">
          Jutsu can be trained at the training grounds in your village; here you can
          find multiple teachers, who will teach you how to advance your jutsu for a
          given price.
        </p>
      </ContentBox>
      <ContentBox
        title="Database"
        subtitle="All known jutsu"
        initialBreak={true}
        topRightContent={
          <div className="sm:flex sm:flex-row">
            {userData && canChangeContent(userData.role) && (
              <Button
                id="create-jutsu"
                className="sm:mr-5"
                label="New Jutsu"
                image={<DocumentPlusIcon className="mr-1 h-5 w-5" />}
                onClick={() => create()}
              />
            )}
            <div className="grow"></div>
            <NavTabs
              current={rarity}
              options={["D", "C", "B", "A", "S"]}
              setValue={setRarity}
            />
          </div>
        }
      >
        {totalLoading && <Loader explanation="Loading data" />}
        {!totalLoading &&
          alljutsus?.map((jutsu, i) => (
            <div
              key={jutsu.id}
              ref={i === alljutsus.length - 1 ? setLastElement : null}
            >
              <ItemWithEffects
                item={jutsu}
                key={jutsu.id}
                onDelete={(id: string) => remove({ id })}
                showEdit="jutsu"
              />
            </div>
          ))}
      </ContentBox>
    </>
  );
};

export default ManualJutsus;
