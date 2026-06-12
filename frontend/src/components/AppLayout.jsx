import { useCallback, useMemo, useState } from "react";
import { Outlet, useSearchParams } from "react-router-dom";
import NavBar from "./NavBar";
import AppDrawer from "./AppDrawer";
import AppFormModal from "./AppFormModal";
import { UIContext } from "../context/UIContext";

function AppLayout() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [refreshKey, setRefreshKey] = useState(0);

  const refresh = useCallback(() => setRefreshKey((k) => k + 1), []);

  const updateParams = useCallback(
    (mutate) => {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          mutate(next);
          return next;
        },
        { replace: false }
      );
    },
    [setSearchParams]
  );

  const openApp = useCallback(
    (id) =>
      updateParams((p) => {
        p.set("app", String(id));
        p.delete("form");
      }),
    [updateParams]
  );
  const closeApp = useCallback(
    () => updateParams((p) => p.delete("app")),
    [updateParams]
  );
  const openNew = useCallback(
    () =>
      updateParams((p) => {
        p.set("form", "new");
        p.delete("app");
      }),
    [updateParams]
  );
  const openEdit = useCallback(
    (id) =>
      updateParams((p) => {
        p.set("form", String(id));
        p.delete("app");
      }),
    [updateParams]
  );
  const closeForm = useCallback(
    () => updateParams((p) => p.delete("form")),
    [updateParams]
  );

  const ctx = useMemo(
    () => ({ refreshKey, refresh, openApp, closeApp, openNew, openEdit, closeForm }),
    [refreshKey, refresh, openApp, closeApp, openNew, openEdit, closeForm]
  );

  const appParam = searchParams.get("app");
  const formParam = searchParams.get("form");

  return (
    <UIContext.Provider value={ctx}>
      <NavBar onQuickAdd={openNew} />
      <Outlet />
      {appParam && (
        <AppDrawer
          appId={Number(appParam)}
          refreshKey={refreshKey}
          onClose={closeApp}
          onEdit={openEdit}
          refresh={refresh}
        />
      )}
      {formParam && (
        <AppFormModal
          mode={formParam}
          onClose={closeForm}
          refresh={refresh}
          openApp={openApp}
        />
      )}
    </UIContext.Provider>
  );
}

export default AppLayout;
