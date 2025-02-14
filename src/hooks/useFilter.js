import { useEffect, useMemo, useRef } from "react";

import { useLocation, useNavigate } from "react-router-dom";
import FormType from "../constants/FormType";

export const EQUAL_SIGN = "~";
export const AND_SIGN = "+";
export const ARRAY_SEPARATOR = "--";

function parseUrl(url) {
  return url
    ?.replace("?", "")
    ?.split(AND_SIGN)
    ?.filter((v) => v)
    ?.reduce((acc, cur) => {
      const [key, value] = cur.split(EQUAL_SIGN);
      return { ...acc, [key]: decodeURIComponent(value) };
    }, {});
}

function stringifyUrl(data) {
  if (data) {
    return Object.entries(data)
      ?.filter(([k, v]) => k && v)
      ?.reduce((acc, [key, val], idx) => {
        return `${acc}${
          idx === 0 ? "" : AND_SIGN
        }${key}${EQUAL_SIGN}${encodeURIComponent(val)}`;
      }, "?");
  }
}

const useFilter = (formData) => {
  console.log(formData);
  const location = useLocation();
  const navigate = useNavigate();

  const initialState = useRef(
    formData?.reduce((acc, cur) => ({ ...acc, [cur.name]: "" }), {})
  );
  const filterState = useMemo(() => {
    return {
      ...initialState.current,
      ...parseUrl(location.search),
    };
  }, [location.search]);

  const setFilterState = (s) => {
    const newQuery = typeof s === "function" ? s(filterState) : s;

    const filteredQuery = Object.entries({ ...filterState, ...newQuery })
      .filter(([k, v]) => v !== "")
      .reduce((acc, [k, v]) => ({ ...acc, [k]: v }), {});

    navigate({
      hash: location.hash,
      search: stringifyUrl(filteredQuery) || "?",
    });
  };

  const formDataObject = useRef();
  useEffect(() => {
    if (formData && !formDataObject.current) {
      formDataObject.current = formData.reduce(
        (acc, cur) => ({
          ...acc,
          [cur.name]: {
            children: cur.children,
          },
        }),
        {}
      );
    }
  }, [formData]);

  function clearChildren(pName, nState) {
    if (formDataObject.current[pName]?.children) {
      return clearChildren(
        formDataObject.current[pName]?.children,
        formDataObject.current[pName].children.reduce(
          (acc, cur) => ({ ...acc, [cur]: undefined }),
          { ...nState }
        )
      );
    }
    return nState;
  }

  function onChange(e, name, type) {
    let newState = clearChildren(name, {});
    if (type === FormType.CHECKBOX_GROUP) {
      const filters =
        filterState[name]?.split(ARRAY_SEPARATOR).filter((v) => v) || [];
      let value = "";

      if (e.target.checked) {
        value = [...new Set([...filters, e.target.value])].join(
          ARRAY_SEPARATOR
        );
      } else {
        value = filters
          .filter((v) => v !== e.target.value)
          .join(ARRAY_SEPARATOR);
      }

      setFilterState((p) => ({ ...p, [name]: value, ...newState }));
    } else if (type === FormType.CHECKBOX) {
      setFilterState((p) => ({
        ...p,
        [name]: e.target.checked ? e.target.value : undefined,
        ...newState,
      }));
    } else {
      setFilterState((p) => ({ ...p, [name]: e.target.value, ...newState }));
    }
  }

  function onClear(name) {
    let newState = clearChildren(name, {});

    setFilterState((p) => ({ ...p, [name]: undefined, ...newState }));
  }
  function onClearAll() {
    setFilterState((p) =>
      Object.keys(p).reduce((acc, key) => ({ ...acc, [key]: undefined }), {})
    );
  }

  return { filterState, setFilterState, onChange, onClear, onClearAll };
};

export default useFilter;
