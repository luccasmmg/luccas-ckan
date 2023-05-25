import { existsSync, promises as fs } from "fs";
import path from "path";
import parse from "../../lib/markdown";

import DataRichDocument from "../../components/DataRichDocument";
import clientPromise from "../../lib/mddb";
import getConfig from "next/config";
import { CKAN } from "@portaljs/ckan";
import { useState } from "react";
import { Dialog } from "@headlessui/react";
import { Bars3Icon, XMarkIcon } from "@heroicons/react/24/outline";

export const getStaticPaths = async () => {
  const contentDir = path.join(process.cwd(), "/content/");
  const contentFolders = await fs.readdir(contentDir, "utf8");
  const paths = contentFolders.map((folder: string) => ({
    params: { path: [folder.split(".")[0]] },
  }));
  return {
    paths,
    fallback: false,
  };
};

const backend_url = getConfig().publicRuntimeConfig.DMS;

const navigation = [
  { name: "Home", href: "/" },
  { name: "Search", href: "/search" },
  { name: "Report", href: "/stories/report_1" },
];


export const getStaticProps = async (context) => {
  const mddb = await clientPromise;
  const storyFile = await mddb.getFileByUrl(context.params.path);
  const md = await fs.readFile(
    `${process.cwd()}/${storyFile.file_path}`,
    "utf8"
  );

  const ckan = new CKAN(backend_url);
  const datasets = storyFile.metadata.datasets
    ? await Promise.all(
        storyFile.metadata.datasets.map(
          async (datasetName: string) =>
            await ckan.getDatasetDetails(datasetName)
        )
      )
    : [];
  const orgs = storyFile.metadata.orgs
    ? await Promise.all(
        storyFile.metadata.orgs.map(
          async (orgName: string) => await ckan.getOrgDetails(orgName)
        )
      )
    : [];

  let { mdxSource, frontMatter } = await parse(md, ".mdx", { datasets, orgs });

  return {
    props: {
      mdxSource,
      frontMatter: JSON.stringify(frontMatter),
    },
  };
};

export default function DatasetPage({ mdxSource, frontMatter }) {
  frontMatter = JSON.parse(frontMatter);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  return (
    <>
      <header className="absolute inset-x-0 top-0 z-50">
        <nav className="flex items-center p-6 lg:px-8" aria-label="Global">
          <div className="flex">
            <a href="#" className="-m-1.5 p-1.5">
              <span className="sr-only">Luccas</span>
              <img
                className="h-8 w-auto rounded-full"
                src="https://avatars.githubusercontent.com/u/11317382?v=4"
                alt=""
              />
            </a>
          </div>
          <div className="flex flex-1 justify-center lg:gap-x-12">
            {navigation.map((item) => (
              <a
                key={item.name}
                href={item.href}
                className="text-sm font-semibold leading-6 text-gray-900"
              >
                {item.name}
              </a>
            ))}
          </div>
        </nav>
        <Dialog
          as="div"
          className="lg:hidden"
          open={mobileMenuOpen}
          onClose={setMobileMenuOpen}
        >
          <div className="fixed inset-0 z-50" />
          <Dialog.Panel className="fixed inset-y-0 right-0 z-50 w-full overflow-y-auto bg-white px-6 py-6 sm:max-w-sm sm:ring-1 sm:ring-gray-900/10">
            <div className="flex items-center justify-between">
              <a href="#" className="-m-1.5 p-1.5">
                <span className="sr-only">Your Company</span>
                <img
                  className="h-8 w-auto rounded-full"
                  src="https://avatars.githubusercontent.com/u/11317382?v=4"
                  alt=""
                />
              </a>
              <button
                type="button"
                className="-m-2.5 rounded-md p-2.5 text-gray-700"
                onClick={() => setMobileMenuOpen(false)}
              >
                <span className="sr-only">Close menu</span>
                <XMarkIcon className="h-6 w-6" aria-hidden="true" />
              </button>
            </div>
            <div className="mt-6 flow-root">
              <div className="-my-6 divide-y divide-gray-500/10">
                <div className="space-y-2 py-6">
                  {navigation.map((item) => (
                    <a
                      key={item.name}
                      href={item.href}
                      className="-mx-3 block rounded-lg px-3 py-2 text-base font-semibold leading-7 text-gray-900 hover:bg-gray-50"
                    >
                      {item.name}
                    </a>
                  ))}
                </div>
                <div className="py-6">
                  <a
                    href="#"
                    className="-mx-3 block rounded-lg px-3 py-2.5 text-base font-semibold leading-7 text-gray-900 hover:bg-gray-50"
                  >
                    Log in
                  </a>
                </div>
              </div>
            </div>
          </Dialog.Panel>
        </Dialog>
      </header>
      <div className="relative isolate px-6 pt-14 lg:px-8">
        <div
          className="absolute inset-x-0 -top-40 -z-10 transform-gpu overflow-hidden blur-3xl sm:-top-80"
          aria-hidden="true"
        >
          <div
            className="relative left-[calc(50%-11rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 rotate-[30deg] bg-gradient-to-tr from-[#ff80b5] to-[#9089fc] opacity-30 sm:left-[calc(50%-30rem)] sm:w-[72.1875rem]"
            style={{
              clipPath:
                "polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)",
            }}
          />
        </div>
        <main className="prose my-16 max-w-7xl mx-auto bg-white py-12 px-8 rounded-lg shadow-lg">
          <DataRichDocument source={mdxSource} />
        </main>
      </div>
    </>
  );
}
