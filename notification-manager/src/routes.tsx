import { Redirect, Route, Switch, useRouteMatch } from 'react-router-dom';
import type { ReactNode } from 'react';
import MappingList from './components/mappings/mapping-list';
import TemplateList from './components/templates/template-list';
import LocalizationList from './components/localization-list/localization-list';

type ApplicationRoutesProps = {
  children?: ReactNode;
};

/**
 * The application checks the View permission before rendering, so no route-level permission check is needed here.
 */
const ApplicationRoutes = (_props: ApplicationRoutesProps) => {
  const match = useRouteMatch();
  return (
    <Switch>
      <Route path={`${match.path}/templates`} component={TemplateList} />
      <Route path={`${match.path}/mappings`} component={MappingList} />
      <Route
        path={`${match.path}/localizations`}
        component={LocalizationList}
      />
      <Redirect to={`${match.url}/templates`} />
    </Switch>
  );
};
ApplicationRoutes.displayName = 'ApplicationRoutes';

export default ApplicationRoutes;
